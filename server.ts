import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { getAddress, recoverMessageAddress } from 'viem';
import { insertWallet, getWhitelistedWallets, checkWallet, EVM_REGEX } from './lib/db.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const IS_VERCEL = process.env.VERCEL === '1';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global CORS Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

function hasStore(): boolean {
  return !!(
    process.env.ARC_BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.ARCPIXLS_BLOB_READ_WRITE_TOKEN ||
    Object.entries(process.env).find(([k, v]) => k.endsWith('_READ_WRITE_TOKEN') && typeof v === 'string' && v.length > 0)
  );
}
const LOCAL_STORE_FILE = path.join(process.cwd(), 'whitelist-data.json');

// Memory cache of submitted wallets
const memWallets = new Map<string, string>(); // lower(wallet) -> submittedAt ISO

// Initialize local file cache if present
try {
  if (fs.existsSync(LOCAL_STORE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf-8'));
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (item?.wallet) {
          memWallets.set(item.wallet.toLowerCase(), item.submittedAt || new Date().toISOString());
        }
      }
    }
  }
} catch (e) {
  console.warn('Failed to load local whitelist cache:', e);
}

function saveLocalCache() {
  try {
    const list = Array.from(memWallets.entries()).map(([wallet, submittedAt]) => ({
      wallet,
      submittedAt,
    }));
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save local whitelist cache:', e);
  }
}

// =========================================================================
// GOOGLE SHEETS LIVE SYNC & WEB APP
// =========================================================================
const GOOGLE_SCRIPT_WEBAPP_URL =
  process.env.GOOGLE_SCRIPT_WEBAPP_URL ||
  'https://script.google.com/macros/s/AKfycbxF7V00wAh-7hL9i4EP6MIGVLWQtNGY8wtl362nZqphwOS-c5twihlCN8ETO-ifs3l_/exec';

const GOOGLE_SHEET_CONFIG_FILE = path.join(process.cwd(), 'google-sheet-config.json');
let activeGoogleSheetUrl = process.env.GOOGLE_SHEET_URL || '';
let lastSheetSyncTime = 0;
const SHEET_CACHE_TTL_MS = 20 * 1000; // 20 seconds cache

try {
  if (fs.existsSync(GOOGLE_SHEET_CONFIG_FILE)) {
    const cfg = JSON.parse(fs.readFileSync(GOOGLE_SHEET_CONFIG_FILE, 'utf-8'));
    if (cfg?.url) activeGoogleSheetUrl = cfg.url;
  }
} catch {
  // ignore
}

export async function syncFromGoogleSheet(customUrl?: string): Promise<{ success: boolean; count: number; error?: string }> {
  const targetUrl = customUrl || activeGoogleSheetUrl;
  if (!targetUrl) {
    return { success: false, count: memWallets.size, error: 'No Google Sheet URL configured.' };
  }

  const match = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = match ? match[1] : targetUrl.trim();

  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    const res = await fetch(csvUrl, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) {
      throw new Error(`Google Sheet returned HTTP ${res.status}. Make sure the sheet Share permission is set to "Anyone with the link can view".`);
    }
    const csvText = await res.text();
    const addresses = csvText.match(/0x[a-fA-F0-9]{40}/g) || [];

    let newlyAdded = 0;
    for (const raw of addresses) {
      const lower = raw.toLowerCase();
      if (!memWallets.has(lower)) {
        memWallets.set(lower, new Date().toISOString());
        newlyAdded++;
      }
    }

    if (newlyAdded > 0) {
      saveLocalCache();
    }

    lastSheetSyncTime = Date.now();
    return { success: true, count: memWallets.size };
  } catch (err: any) {
    console.warn('Google Sheet sync error:', err.message);
    return { success: false, count: memWallets.size, error: err.message };
  }
}

// Initial sync if URL present
if (activeGoogleSheetUrl) {
  syncFromGoogleSheet().catch(() => {});
}

async function addWallet(wallet: string) {
  const trimmed = wallet.trim();
  if (!EVM_REGEX.test(trimmed)) throw new Error('INVALID_ADDRESS');
  if (memWallets.has(trimmed.toLowerCase())) throw new Error('DUPLICATE_WALLET');

  let spot = memWallets.size + 1;
  let total = spot;

  // 1. Post to Google Sheet Web App
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: trimmed }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data: any = await res.json();
      if (data?.already) throw new Error('DUPLICATE_WALLET');
      if (data?.spot) spot = data.spot;
      if (data?.total) total = data.total;
    }
  } catch (err: any) {
    if (err.message === 'DUPLICATE_WALLET') throw err;
    console.warn('Failed to append to Google Script:', err.message);
  }

  // 2. Also save to Blob store if active
  if (hasStore()) {
    try {
      await insertWallet(trimmed);
    } catch (err: any) {
      console.warn('Blob store write failed (store suspended/limit):', err?.message || err);
    }
  }

  const submittedAt = new Date().toISOString();
  memWallets.set(trimmed.toLowerCase(), submittedAt);
  saveLocalCache();
  return { submittedAt, spot, total: Math.max(total, memWallets.size) };
}

// Health check endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Rare People',
    chain: 'Robinhood',
    store: hasStore() ? 'vercel-blob' : 'local-storage',
    total: memWallets.size,
  });
});

// Helper for checking WL status across both blob store and local memory cache
async function doCheckWallet(rawWallet: string) {
  const wallet = rawWallet.trim();
  if (!EVM_REGEX.test(wallet)) {
    throw new Error('INVALID_ADDRESS');
  }

  // Refresh from Google Sheet if cache expired
  if (activeGoogleSheetUrl && Date.now() - lastSheetSyncTime > SHEET_CACHE_TTL_MS) {
    try {
      await syncFromGoogleSheet();
    } catch {
      // ignore transient sync failures
    }
  }

  const lower = wallet.toLowerCase();

  // 1. Check local & Google Sheet synced memory cache
  if (memWallets.has(lower)) {
    const keys = Array.from(memWallets.keys());
    const spot = keys.indexOf(lower) + 1;
    return {
      whitelisted: true,
      wallet,
      submittedAt: memWallets.get(lower),
      spot: spot > 0 ? spot : 1,
      total: memWallets.size,
    };
  }

  // 2. Check Google Apps Script Web App directly
  try {
    const gRes = await fetch(
      `${GOOGLE_SCRIPT_WEBAPP_URL}?wallet=${encodeURIComponent(wallet)}`
    );
    if (gRes.ok) {
      const gData: any = await gRes.json();
      if (gData && gData.whitelisted) {
        memWallets.set(lower, new Date().toISOString());
        return {
          whitelisted: true,
          wallet,
          spot: gData.spot || 1,
          total: Math.max(memWallets.size, gData.total || 1),
        };
      }
    }
  } catch (e) {
    // Ignore transient network errors to Google Script
  }

  // 3. Check Blob store if configured
  if (hasStore()) {
    try {
      const result = await checkWallet(wallet);
      if (result.whitelisted) {
        return result;
      }
    } catch (e) {
      console.warn('Blob check failed, falling back to local memory:', e);
    }
  }

  return {
    whitelisted: false,
    wallet,
    total: memWallets.size,
  };
}

// Endpoint to set or update the Google Sheet link dynamically
app.post(['/api/whitelist/set-sheet', '/api/admin/set-sheet'], async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  if (!url) {
    return res.status(400).json({ error: 'Please provide a valid Google Sheet URL or ID.' });
  }
  activeGoogleSheetUrl = url;
  try {
    fs.writeFileSync(GOOGLE_SHEET_CONFIG_FILE, JSON.stringify({ url }, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to persist google-sheet-config.json:', e);
  }
  const result = await syncFromGoogleSheet(url);
  return res.json({ ...result, sheetUrl: activeGoogleSheetUrl, totalWallets: memWallets.size });
});

// Endpoint to trigger manual sync from Google Sheet
app.get('/api/whitelist/sync-sheet', async (_req, res) => {
  const result = await syncFromGoogleSheet();
  return res.json({ ...result, sheetUrl: activeGoogleSheetUrl, totalWallets: memWallets.size });
});

// GET /api/whitelist/check?wallet=0x... or GET /api/whitelist?check=0x...
app.get(['/api/whitelist/check', '/whitelist/check'], async (req, res) => {
  try {
    const wallet = typeof req.query.wallet === 'string' ? req.query.wallet : (req.query.check as string) || '';
    if (!wallet) {
      return res.status(400).json({ error: 'Please provide a wallet address to check.' });
    }
    const result = await doCheckWallet(wallet);
    return res.json(result);
  } catch (err: any) {
    if (err.message === 'INVALID_ADDRESS') {
      return res.status(400).json({ error: 'Enter a valid EVM address (0x followed by 40 hex characters).' });
    }
    console.error('Error in check whitelist:', err);
    return res.status(500).json({ error: 'Failed to verify whitelist status.' });
  }
});

// POST /api/whitelist/check
app.post(['/api/whitelist/check', '/whitelist/check'], async (req, res) => {
  try {
    const wallet = typeof req.body?.wallet === 'string' ? req.body.wallet : '';
    if (!wallet) {
      return res.status(400).json({ error: 'Please provide a wallet address to check.' });
    }
    const result = await doCheckWallet(wallet);
    return res.json(result);
  } catch (err: any) {
    if (err.message === 'INVALID_ADDRESS') {
      return res.status(400).json({ error: 'Enter a valid EVM address (0x followed by 40 hex characters).' });
    }
    console.error('Error in check whitelist:', err);
    return res.status(500).json({ error: 'Failed to verify whitelist status.' });
  }
});

// POST — register a wallet on the whitelist
app.post(['/api/whitelist', '/whitelist', '/api/whitelist/add'], async (req, res) => {
  try {
    // If request contains check flag, redirect to check
    if (req.body?.action === 'check') {
      const wallet = typeof req.body?.wallet === 'string' ? req.body.wallet.trim() : '';
      const result = await doCheckWallet(wallet);
      return res.json(result);
    }

    const wallet = typeof req.body?.wallet === 'string' ? req.body.wallet.trim() : '';
    if (!EVM_REGEX.test(wallet)) {
      return res.status(400).json({ error: 'Enter a valid EVM address (0x followed by 40 hex characters).' });
    }
    const { submittedAt, total } = await addWallet(wallet);
    return res.status(201).json({ ok: true, submittedAt, total });
  } catch (err: any) {
    if (err.message === 'DUPLICATE_WALLET' || err.code === '23505') {
      return res.status(200).json({ ok: true, message: 'Wallet already on whitelist', total: memWallets.size });
    }
    if (err.message === 'INVALID_ADDRESS') {
      return res.status(400).json({ error: 'Enter a valid EVM address (0x followed by 40 hex characters).' });
    }
    console.error('Error in POST /api/whitelist:', err);
    return res.status(500).json({ error: 'Something went wrong saving your spot. Try again.' });
  }
});

// POST /api/whitelist/bulk-add
app.post('/api/whitelist/bulk-add', async (req, res) => {
  try {
    const wallets = Array.isArray(req.body?.wallets) ? req.body.wallets : [];
    let added = 0;
    for (const raw of wallets) {
      if (typeof raw === 'string' && EVM_REGEX.test(raw.trim())) {
        const lower = raw.trim().toLowerCase();
        if (!memWallets.has(lower)) {
          memWallets.set(lower, new Date().toISOString());
          added++;
        }
      }
    }
    if (added > 0) saveLocalCache();
    return res.json({ ok: true, added, total: memWallets.size });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Download/Export endpoints for whitelist backup
app.get(['/api/export-whitelist', '/api/export-whitelist/json'], (_req, res) => {
  let list: { wallet: string; submittedAt: string }[] = [];
  if (fs.existsSync(LOCAL_STORE_FILE)) {
    try {
      list = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf-8'));
    } catch {
      list = [];
    }
  }
  if (list.length === 0 && memWallets.size > 0) {
    list = Array.from(memWallets.entries()).map(([wallet, submittedAt]) => ({ wallet, submittedAt }));
  }
  res.setHeader('Content-Disposition', 'attachment; filename="rare-people-whitelist.json"');
  res.setHeader('Content-Type', 'application/json');
  return res.json(list);
});

app.get(['/api/export-whitelist/csv', '/api/whitelist.csv'], (_req, res) => {
  let list: { wallet: string; submittedAt: string }[] = [];
  if (fs.existsSync(LOCAL_STORE_FILE)) {
    try {
      list = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf-8'));
    } catch {
      list = [];
    }
  }
  if (list.length === 0 && memWallets.size > 0) {
    list = Array.from(memWallets.entries()).map(([wallet, submittedAt]) => ({ wallet, submittedAt }));
  }
  const csv = ['Index,Wallet Address,Submitted At'].concat(
    list.map((item, idx) => `${idx + 1},${item.wallet},${item.submittedAt}`)
  ).join('\n');

  res.setHeader('Content-Disposition', 'attachment; filename="rare-people-whitelist.csv"');
  res.setHeader('Content-Type', 'text/csv');
  return res.send(csv);
});

// GET /api/whitelist: Support ?check=0x... or return total count
app.get(['/api/whitelist', '/whitelist'], async (req, res) => {
  if (req.query.check && typeof req.query.check === 'string') {
    try {
      const result = await doCheckWallet(req.query.check);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: 'Invalid EVM address' });
    }
  }

  // Count response
  try {
    if (hasStore()) {
      const data = await getWhitelistedWallets();
      return res.json({ status: 'ok', count: data.count });
    }
  } catch {
    // fallback to local
  }
  return res.json({ status: 'ok', count: memWallets.size });
});

function getOpenSeaDropSlug(): string | null {
  const slug = (process.env.OPENSEA_COLLECTION_SLUG || '').trim();
  if (!slug || slug.toLowerCase() === 'test-collection') return null;
  return slug;
}

function openSeaHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const apiKey = process.env.OPENSEA_API_KEY;
  if (apiKey) headers['X-API-KEY'] = apiKey;
  return headers;
}

function isPublicStage(stage: any): boolean {
  const type = String(stage?.stage_type || stage?.stageType || '').toLowerCase();
  return type.includes('public');
}

function stageWindowStatus(stage: any, nowMs: number, isActive: boolean): string {
  const start = Date.parse(stage?.start_time || stage?.startTime || '');
  const end = Date.parse(stage?.end_time || stage?.endTime || '');
  if (!Number.isNaN(end) && nowMs >= end) return 'ENDED';
  if (!Number.isNaN(start) && nowMs < start) return 'UPCOMING';
  const inWindow =
    isActive ||
    (!Number.isNaN(start) && !Number.isNaN(end) && nowMs >= start && nowMs < end) ||
    (!Number.isNaN(start) && Number.isNaN(end) && nowMs >= start);
  if (inWindow) return isPublicStage(stage) ? 'OPEN' : 'ACTIVE';
  return 'INACTIVE';
}

function normalizeStageId(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '');
}

function collectEligibilityStageRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.stages)) return payload.stages;
  if (Array.isArray(payload?.data?.stages)) return payload.data.stages;
  if (Array.isArray(payload?.eligibility)) return payload.eligibility;
  if (payload?.stages && typeof payload.stages === 'object') {
    return Object.entries(payload.stages).map(([id, row]) =>
      row && typeof row === 'object' ? { stage_uuid: id, ...(row as object) } : { stage_uuid: id }
    );
  }
  return [];
}

function parseEligibilityRows(payload: any): Record<
  string,
  { isEligible: boolean; maxTotalMintableByWallet: string | null }
> {
  const map: Record<string, { isEligible: boolean; maxTotalMintableByWallet: string | null }> = {};
  const rows = collectEligibilityStageRows(payload);
  const firstKeys = rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]).join(',') : '';
  logAuthStep(`eligibility_parse rows=${rows.length} keys=${firstKeys || 'none'}`, 200);
  for (const row of rows) {
    const id = normalizeStageId(row?.stage_uuid || row?.uuid || row?.stageUuid || row?.id);
    if (!id) continue;
    let isEligible: boolean | null = null;
    if (typeof row.is_eligible === 'boolean') isEligible = row.is_eligible;
    else if (typeof row.isEligible === 'boolean') isEligible = row.isEligible;
    else if (typeof row.eligible === 'boolean') isEligible = row.eligible;
    if (typeof isEligible !== 'boolean') continue;
    const cap = row.max_total_mintable_by_wallet ?? row.maxTotalMintableByWallet ?? null;
    map[id] = {
      isEligible,
      maxTotalMintableByWallet: cap === undefined || cap === null ? null : String(cap),
    };
  }
  return map;
}

const SIWE_STATEMENT =
  'Click to sign in and accept the OpenSea Terms of Service (https://opensea.io/tos) and Privacy Policy (https://opensea.io/privacy).';
const SESSION_COOKIE_NAMES = ['access_token', 'refresh_token'];
const pendingSiwe = new Map<string, { raw: string; createdAt: number }>();
const eligJwtByWallet = new Map<string, { jwt: string; createdAt: number }>();
const ELIG_JWT_COOKIE = 'rp_os_elig_jwt';
const ELIG_WALLET_COOKIE = 'rp_os_elig_wallet';
const ELIG_JWT_TTL_MS = 12 * 60 * 60 * 1000;
const SAFE_ELIG_FAIL = 'Eligibility check failed — please authenticate again.';

class AuthStepError extends Error {
  step: string;
  status: number;
  constructor(step: string, status: number, message: string) {
    super(message);
    this.step = step;
    this.status = status;
  }
}

function logAuthStep(step: string, status: number) {
  console.warn(`[opensea-auth] ${step} HTTP ${status}`);
}

function sanitizeClientError(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    /bearer\s+/i.test(trimmed) ||
    /authorization/i.test(trimmed) ||
    /\bjwt\b/i.test(trimmed) ||
    /\bpat\b/i.test(trimmed) ||
    /access_token|refresh_token|api[_-]?key|cookie|signature/i.test(trimmed) ||
    /0x[a-fA-F0-9]{64,}/.test(trimmed)
  ) {
    return null;
  }
  return trimmed.slice(0, 180);
}

async function fetchOpenSeaJson(
  url: string,
  init: RequestInit,
  step: string,
  timeoutMs = 25000
): Promise<{ res: Response; json: any }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    const text = await res.text();
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }
    logAuthStep(step, res.status);
    return { res, json };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      logAuthStep(step, 0);
      throw new AuthStepError(step, 0, SAFE_ELIG_FAIL);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}

function cookiePair(name: string, value: string, maxAgeSec: number): string {
  const secure = IS_VERCEL || IS_PROD ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

function clearEligSession(res: express.Response, wallet?: string) {
  if (wallet) eligJwtByWallet.delete(wallet.toLowerCase());
  res.append('Set-Cookie', cookiePair(ELIG_JWT_COOKIE, '', 0));
  res.append('Set-Cookie', cookiePair(ELIG_WALLET_COOKIE, '', 0));
}

function storeEligJwt(res: express.Response, wallet: string, jwt: string) {
  const key = wallet.toLowerCase();
  eligJwtByWallet.set(key, { jwt, createdAt: Date.now() });
  res.append('Set-Cookie', cookiePair(ELIG_WALLET_COOKIE, key, 12 * 60 * 60));
  if (jwt.length <= 3500) {
    res.append('Set-Cookie', cookiePair(ELIG_JWT_COOKIE, jwt, 12 * 60 * 60));
  }
}

function readEligJwt(req: express.Request, minter: string): string {
  const key = minter.toLowerCase();
  const cookies = parseCookieHeader(req.headers.cookie);
  const cookieWallet = (cookies[ELIG_WALLET_COOKIE] || '').toLowerCase();
  const cookieJwt = cookies[ELIG_JWT_COOKIE] || '';
  if (cookieWallet === key && cookieJwt) return cookieJwt;
  const mem = eligJwtByWallet.get(key);
  if (mem && Date.now() - mem.createdAt < ELIG_JWT_TTL_MS) return mem.jwt;
  return '';
}

function buildOpenSeaSiweMessage(address: string, nonce: string) {
  const checksum = getAddress(address);
  const issuedAt = new Date();
  const statement = `${SIWE_STATEMENT}\n`;
  const prefix =
    `opensea.io wants you to sign in with your Ethereum account:\n` +
    `${checksum}\n\n${statement}`;
  const suffix =
    `URI: https://opensea.io\n` +
    `Version: 1\n` +
    `Chain ID: 1\n` +
    `Nonce: ${nonce}\n` +
    `Issued At: ${issuedAt.toISOString()}`;
  return `${prefix}\n${suffix}`;
}

function parseOpenSeaSiwxMessage(message: string) {
  const lines = message.split('\n');
  const domainMatch =
    /^(?<domain>[^ ]+) wants you to sign in with your (?:(?<accountType>Ethereum|Solana|Bitcoin) )?account:$/.exec(
      lines[0] ?? ''
    );
  const address = lines[1] || '';
  if (!domainMatch?.groups || !address) {
    throw new AuthStepError('siwe_message', 400, SAFE_ELIG_FAIL);
  }
  const fields: Record<string, string> = {
    uri: '',
    version: '',
    chainId: '',
    nonce: '',
    issuedAt: '',
  };
  const prefixes: Record<string, string> = {
    uri: 'URI: ',
    version: 'Version: ',
    chainId: 'Chain ID: ',
    nonce: 'Nonce: ',
    issuedAt: 'Issued At: ',
  };
  let firstField = lines.length;
  for (let i = 2; i < lines.length; i += 1) {
    const line = lines[i];
    for (const key of Object.keys(prefixes)) {
      if (!fields[key] && line.startsWith(prefixes[key])) {
        fields[key] = line.slice(prefixes[key].length);
        firstField = Math.min(firstField, i);
      }
    }
  }
  const statementLines = lines.slice(2, firstField);
  while (statementLines.length && statementLines[0] === '') statementLines.shift();
  while (statementLines.length && statementLines.at(-1) === '') statementLines.pop();
  const parsed: Record<string, string> = {
    domain: domainMatch.groups.domain,
    address,
    statement: statementLines.join('\n'),
    uri: fields.uri,
    version: fields.version,
    chainId: fields.chainId,
    nonce: fields.nonce,
    issuedAt: fields.issuedAt,
  };
  if (domainMatch.groups.accountType) parsed.accountType = domainMatch.groups.accountType;
  return parsed;
}

function extractSessionCookies(headers: Headers): string {
  const getSetCookie = (headers as any).getSetCookie;
  const raw: string[] =
    typeof getSetCookie === 'function'
      ? getSetCookie.call(headers)
      : String(headers.get('set-cookie') || '')
          .split(/,(?=\s*(?:access_token|refresh_token)=)/)
          .map((s) => s.trim())
          .filter(Boolean);
  const cookies = new Map<string, string>();
  for (const cookie of raw) {
    const pair = cookie.split(';')[0];
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    if (SESSION_COOKIE_NAMES.includes(name)) {
      cookies.set(name, pair.slice(eq + 1).trim());
    }
  }
  if (!cookies.has('access_token') || !cookies.has('refresh_token')) {
    throw new AuthStepError('siwe_verify', 502, SAFE_ELIG_FAIL);
  }
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function normalizeSignature(signature: string): `0x${string}` {
  const trimmed = signature.trim();
  return (trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`) as `0x${string}`;
}

async function exchangeWalletJwt(signature: string, rawMessage: string) {
  const parsed = parseOpenSeaSiwxMessage(rawMessage);
  const { res: verifyRes } = await fetchOpenSeaJson(
    'https://api.opensea.io/api/v2/auth/siwe/verify',
    {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: parsed,
        signature,
        chainArch: 'EVM',
      }),
    },
    'siwe_verify'
  );
  if (!verifyRes.ok) {
    throw new AuthStepError('siwe_verify', verifyRes.status, SAFE_ELIG_FAIL);
  }
  const sessionCookie = extractSessionCookies(verifyRes.headers);

  const { res: patRes, json: patJson } = await fetchOpenSeaJson(
    'https://api.opensea.io/api/v2/auth/tokens',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        label: `rare-people-eligibility-${Date.now()}`,
        scopes: ['read:eligibility'],
        expiresInDays: 1,
      }),
    },
    'create_pat'
  );
  const pat = typeof patJson?.token === 'string' ? patJson.token : '';
  if (!patRes.ok || !pat) {
    throw new AuthStepError('create_pat', patRes.status || 502, SAFE_ELIG_FAIL);
  }

  const { res: exchRes, json: exchJson } = await fetchOpenSeaJson(
    'https://api.opensea.io/api/v2/auth/tokens/exchange',
    {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectToken: pat,
        subjectTokenType: 'ACCESS_TOKEN',
      }),
    },
    'exchange_jwt'
  );
  if (patJson && typeof patJson === 'object') patJson.token = undefined;
  const accessToken =
    typeof exchJson?.accessToken === 'string'
      ? exchJson.accessToken
      : typeof exchJson?.access_token === 'string'
        ? exchJson.access_token
        : '';
  if (!exchRes.ok || !accessToken) {
    throw new AuthStepError('exchange_jwt', exchRes.status || 502, SAFE_ELIG_FAIL);
  }
  return accessToken;
}

app.get('/api/opensea/auth/siwe', async (req, res) => {
  try {
    const addressRaw = typeof req.query.address === 'string' ? req.query.address.trim() : '';
    if (!EVM_REGEX.test(addressRaw)) {
      return res.status(400).json({ error: 'Valid wallet address is required to check eligibility.', step: 'nonce' });
    }
    const { res: nonceRes, json: nonceJson } = await fetchOpenSeaJson(
      'https://api.opensea.io/api/v2/auth/siwe/nonce',
      { method: 'POST', headers: { Accept: 'application/json' } },
      'nonce'
    );
    if (!nonceRes.ok || !nonceJson?.nonce) {
      return res.status(502).json({ error: SAFE_ELIG_FAIL, step: 'nonce', status: nonceRes.status });
    }
    const raw = buildOpenSeaSiweMessage(addressRaw, String(nonceJson.nonce));
    pendingSiwe.set(addressRaw.toLowerCase(), { raw, createdAt: Date.now() });
    return res.json({ message: raw });
  } catch (err: any) {
    const step = err instanceof AuthStepError ? err.step : 'nonce';
    const status = err instanceof AuthStepError ? err.status || 500 : 500;
    return res.status(status || 500).json({ error: SAFE_ELIG_FAIL, step, status });
  }
});

app.post('/api/opensea/auth/siwe', async (req, res) => {
  try {
    const addressRaw = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
    const signatureRaw = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
    if (!EVM_REGEX.test(addressRaw) || !signatureRaw) {
      return res.status(400).json({ error: 'Wallet address and signature are required.', step: 'personal_sign' });
    }
    const pending = pendingSiwe.get(addressRaw.toLowerCase());
    if (!pending || Date.now() - pending.createdAt > 10 * 60 * 1000) {
      pendingSiwe.delete(addressRaw.toLowerCase());
      return res.status(400).json({ error: SAFE_ELIG_FAIL, step: 'siwe_message' });
    }
    const parsed = parseOpenSeaSiwxMessage(pending.raw);
    if (parsed.address.toLowerCase() !== addressRaw.toLowerCase()) {
      return res.status(400).json({ error: SAFE_ELIG_FAIL, step: 'siwe_message' });
    }
    const signature = normalizeSignature(signatureRaw);
    const recovered = await recoverMessageAddress({
      message: pending.raw,
      signature,
    });
    if (recovered.toLowerCase() !== addressRaw.toLowerCase()) {
      return res.status(401).json({ error: SAFE_ELIG_FAIL, step: 'personal_sign' });
    }
    const jwt = await exchangeWalletJwt(signature, pending.raw);
    pendingSiwe.delete(addressRaw.toLowerCase());
    storeEligJwt(res, addressRaw, jwt);
    return res.json({ ok: true, step: 'complete' });
  } catch (err: any) {
    const step = err instanceof AuthStepError ? err.step : 'siwe_verify';
    const status = err instanceof AuthStepError ? err.status || 401 : 401;
    return res.status(status >= 400 ? status : 401).json({
      error: SAFE_ELIG_FAIL,
      step,
      status,
    });
  }
});

// Drop details + per-wallet eligibility (API key stays on the server)
async function fetchOpenSeaEligibility(
  slug: string,
  walletJwt: string
): Promise<{
  ok: boolean;
  status: number;
  rows: Record<string, { isEligible: boolean; maxTotalMintableByWallet: string | null }>;
  error: string | null;
}> {
  const { res: eligRes, json: eligJson } = await fetchOpenSeaJson(
    `https://api.opensea.io/api/v2/drops/${encodeURIComponent(slug)}/eligibility`,
    {
      headers: {
        ...openSeaHeaders(),
        Authorization: `Bearer ${walletJwt}`,
      },
    },
    'eligibility'
  );
  if (eligRes.ok) {
    const topKeys = eligJson && typeof eligJson === 'object' ? Object.keys(eligJson).join(',') : 'none';
    logAuthStep(`eligibility_body keys=${topKeys || 'none'}`, eligRes.status);
    return { ok: true, status: eligRes.status, rows: parseEligibilityRows(eligJson), error: null };
  }
  const errMsg = sanitizeClientError(
    (Array.isArray(eligJson?.errors) && eligJson.errors[0]) || eligJson?.detail || eligJson?.message
  );
  return {
    ok: false,
    status: eligRes.status,
    rows: {},
    error: errMsg || SAFE_ELIG_FAIL,
  };
}

function eligibilityStatusForMinter(
  minter: string,
  eligibilityLoaded: boolean,
  jwtMatchesMinter: boolean,
  isEligible: boolean | null
): string | null {
  if (!minter) return null;
  if (isEligible === true) return 'ELIGIBLE';
  if (isEligible === false) return 'NOT ELIGIBLE';
  if (!jwtMatchesMinter || !eligibilityLoaded) return 'AUTH REQUIRED';
  return 'AUTH REQUIRED';
}

app.get('/api/opensea/drop', async (req, res) => {
  try {
    const slug = getOpenSeaDropSlug();
    if (!slug) {
      return res.status(503).json({
        error: 'OPENSEA_COLLECTION_SLUG is not configured. Set the real OpenSea collection slug on the server.',
      });
    }
    if (!process.env.OPENSEA_API_KEY) {
      return res.status(503).json({
        error: 'OpenSea API key is not configured on the server.',
      });
    }

    const minterRaw = typeof req.query.minter === 'string' ? req.query.minter.trim() : '';
    const minter = EVM_REGEX.test(minterRaw) ? minterRaw : '';

    const dropRes = await fetch(`https://api.opensea.io/api/v2/drops/${encodeURIComponent(slug)}`, {
      headers: openSeaHeaders(),
    });
    const dropText = await dropRes.text();
    let drop: any = {};
    try {
      drop = JSON.parse(dropText);
    } catch {
      drop = { message: dropText };
    }
    if (!dropRes.ok) {
      const errMsg =
        (Array.isArray(drop?.errors) && drop.errors[0]) ||
        drop?.detail ||
        drop?.message ||
        `OpenSea drop details failed (${dropRes.status})`;
      return res.status(dropRes.status).json({ error: errMsg });
    }

    const stages: any[] = Array.isArray(drop.stages) ? [...drop.stages] : [];
    stages.sort((a, b) => {
      const aStart = Date.parse(a?.start_time || a?.startTime || '') || 0;
      const bStart = Date.parse(b?.start_time || b?.startTime || '') || 0;
      return aStart - bStart;
    });
    const active = drop.active_stage || drop.activeStage || null;
    const next = drop.next_stage || drop.nextStage || null;
    const nowMs = Date.now();

    const walletJwt = minter ? readEligJwt(req, minter) : '';
    const jwtMatchesMinter = Boolean(minter && walletJwt);

    let eligibilityByUuid: Record<string, { isEligible: boolean; maxTotalMintableByWallet: string | null }> = {};
    let eligibilityLoaded = false;
    let eligibilityAuthRequired = Boolean(minter && !jwtMatchesMinter);
    let eligibilityAuthError: string | null = null;

    if (minter && jwtMatchesMinter) {
      try {
        const elig = await fetchOpenSeaEligibility(slug, walletJwt);
        if (elig.ok) {
          eligibilityByUuid = elig.rows;
          const hasBoolean = Object.values(eligibilityByUuid).some((row) => typeof row.isEligible === 'boolean');
          if (hasBoolean) {
            eligibilityLoaded = true;
            eligibilityAuthRequired = false;
          } else {
            eligibilityAuthRequired = true;
            eligibilityAuthError = SAFE_ELIG_FAIL;
          }
        } else if (elig.status === 401 || elig.status === 403) {
          clearEligSession(res, minter);
          eligibilityAuthRequired = true;
          eligibilityAuthError = SAFE_ELIG_FAIL;
        } else {
          eligibilityAuthRequired = true;
          eligibilityAuthError = SAFE_ELIG_FAIL;
        }
      } catch {
        eligibilityAuthRequired = true;
        eligibilityAuthError = SAFE_ELIG_FAIL;
      }
    }

    const mappedStages = stages.map((stage) => {
      const uuid = stage?.uuid || stage?.stage_uuid || null;
      const eligKey = normalizeStageId(uuid);
      const isActive = Boolean(
        active &&
          (active.uuid === uuid ||
            (uuid && active.stage_uuid === uuid) ||
            String(active.label || '') === String(stage.label || ''))
      );
      const windowStatus = stageWindowStatus(stage, nowMs, isActive);
      const windowDisplay = windowStatus === 'OPEN' ? 'ACTIVE' : windowStatus === 'INACTIVE' ? 'UPCOMING' : windowStatus;
      const elig = eligKey ? eligibilityByUuid[eligKey] : undefined;
      const isEligible = elig ? elig.isEligible : null;
      const eligibilityStatus = eligibilityStatusForMinter(
        minter,
        eligibilityLoaded,
        jwtMatchesMinter,
        isEligible
      );

      return {
        uuid,
        label: stage?.label ?? stage?.name ?? '',
        stageType: stage?.stage_type || stage?.stageType || null,
        startTime: stage?.start_time || stage?.startTime || null,
        endTime: stage?.end_time || stage?.endTime || null,
        price: stage?.price ?? null,
        priceCurrencyAddress: stage?.price_currency_address || stage?.priceCurrencyAddress || null,
        maxPerWallet: stage?.max_per_wallet ?? stage?.maxPerWallet ?? null,
        allowlistWalletCount: stage?.allowlist_wallet_count ?? stage?.allowlistWalletCount ?? null,
        maxTotalMintableByWallet: elig?.maxTotalMintableByWallet ?? null,
        isActive: isActive || windowDisplay === 'ACTIVE',
        windowStatus: windowDisplay,
        isEligible,
        eligibilityStatus,
        status: windowDisplay,
      };
    });

    const currentFromWindow = mappedStages.find(
      (s) => s.windowStatus === 'ACTIVE' || s.windowStatus === 'OPEN'
    );
    const currentStageLabel =
      (active && (active.label || active.name)) ||
      currentFromWindow?.label ||
      null;
    const nextStageLabel = (next && (next.label || next.name)) || null;

    return res.json({
      collectionName: drop.collection_name || drop.collectionName || null,
      collectionSlug: drop.collection_slug || slug,
      contractAddress: drop.contract_address || drop.contractAddress || null,
      maxSupply: drop.max_supply ?? drop.maxSupply ?? null,
      totalSupply: drop.total_supply ?? drop.totalSupply ?? null,
      isMinting: Boolean(drop.is_minting ?? drop.isMinting),
      chain: drop.chain || null,
      currentStage: currentStageLabel,
      nextStage: nextStageLabel,
      eligibilityLoaded,
      eligibilityAuthRequired,
      eligibilityAuthError,
      stages: mappedStages,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Failed to load OpenSea drop details.',
    });
  }
});

app.get('/api/opensea/eligibility', async (req, res) => {
  try {
    const slug = getOpenSeaDropSlug();
    if (!slug) {
      return res.status(503).json({ error: 'OPENSEA_COLLECTION_SLUG is not configured.' });
    }
    if (!process.env.OPENSEA_API_KEY) {
      return res.status(503).json({ error: 'OpenSea API key is not configured on the server.' });
    }
    const minterRaw = typeof req.query.minter === 'string' ? req.query.minter.trim() : '';
    const minter = EVM_REGEX.test(minterRaw) ? minterRaw : '';
    if (!minter) {
      return res.status(400).json({ error: 'Valid minter wallet is required.' });
    }
    const walletJwt = readEligJwt(req, minter);
    const jwtMatchesMinter = Boolean(walletJwt);
    if (!jwtMatchesMinter) {
      return res.json({
        eligibilityLoaded: false,
        eligibilityAuthRequired: true,
        stages: [],
      });
    }
    const elig = await fetchOpenSeaEligibility(slug, walletJwt);
    if (!elig.ok) {
      if (elig.status === 401 || elig.status === 403) {
        clearEligSession(res, minter);
      }
      return res.status(elig.status === 401 || elig.status === 403 ? 401 : 502).json({
        eligibilityLoaded: false,
        eligibilityAuthRequired: true,
        error: SAFE_ELIG_FAIL,
      });
    }
    const stages = Object.entries(elig.rows).map(([uuid, row]) => ({
      uuid,
      isEligible: row.isEligible,
      eligibilityStatus: row.isEligible === true ? 'ELIGIBLE' : row.isEligible === false ? 'NOT ELIGIBLE' : 'AUTH REQUIRED',
      maxTotalMintableByWallet: row.maxTotalMintableByWallet,
    }));
    const hasBoolean = stages.some((row) => row.isEligible === true || row.isEligible === false);
    if (!hasBoolean) {
      return res.json({
        eligibilityLoaded: false,
        eligibilityAuthRequired: true,
        error: SAFE_ELIG_FAIL,
        stages: [],
      });
    }
    return res.json({
      eligibilityLoaded: true,
      eligibilityAuthRequired: false,
      stages,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load OpenSea eligibility.' });
  }
});

// ==============================================================================
// OPENSEA DROPS API MINT ROUTE (SERVER-SIDE ONLY)
// Proxies to https://api.opensea.io/api/v2/drops/{slug}/mint
// Keeps OPENSEA_API_KEY secure on server. Returns { to, data, value, chain }
// ==============================================================================
function openSeaClientError(status: number, data: any): string {
  const collected: string[] = [];
  const push = (item: unknown) => {
    if (typeof item === 'string' && item.trim()) collected.push(item.trim());
    else if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      const nested = rec.message || rec.detail || rec.error || rec.code;
      if (typeof nested === 'string' && nested.trim()) collected.push(nested.trim());
    }
  };
  if (Array.isArray(data?.errors)) data.errors.forEach(push);
  else push(data?.errors);
  push(data?.detail);
  push(data?.message);
  push(data?.error);
  const unique = [...new Set(collected)];
  if (unique.length) return unique.join(' ');
  if (status === 409) {
    return 'This mint conflicts with the current drop state (already minted, stage closed, or supply exhausted).';
  }
  if (status === 422) {
    return 'OpenSea rejected this mint request (not eligible, invalid quantity, or stage not open).';
  }
  return `OpenSea mint failed (${status}).`;
}

function extractMintTx(payload: any): { to: unknown; data: unknown; value: unknown; chain: unknown } {
  const tx = payload?.transaction || payload?.result || payload;
  return {
    to: tx?.to || tx?.target,
    data: tx?.data || tx?.calldata,
    value: tx?.value,
    chain: tx?.chain || payload?.chain,
  };
}

app.post('/api/opensea/mint', async (req, res) => {
  try {
    const { minter, quantity } = req.body || {};

    if (!minter || typeof minter !== 'string' || !EVM_REGEX.test(minter.trim())) {
      return res.status(400).json({ error: 'Valid EVM minter wallet address is required.' });
    }

    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 100.' });
    }

    const dropSlug = getOpenSeaDropSlug();
    if (!dropSlug) {
      return res.status(503).json({
        error: 'OPENSEA_COLLECTION_SLUG is not configured. Set the real OpenSea collection slug on the server.',
      });
    }
    if (!process.env.OPENSEA_API_KEY) {
      return res.status(503).json({ error: 'OpenSea API key is not configured on the server.' });
    }

    const osResponse = await fetch(
      `https://api.opensea.io/api/v2/drops/${encodeURIComponent(dropSlug)}/mint`,
      {
        method: 'POST',
        headers: openSeaHeaders(),
        body: JSON.stringify({
          minter: minter.trim(),
          quantity: qty,
        }),
      }
    );

    const responseText = await osResponse.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    if (!osResponse.ok) {
      const errMsg = openSeaClientError(osResponse.status, responseData);
      return res.status(osResponse.status).json({
        error: errMsg,
        code: osResponse.status,
      });
    }

    const tx = extractMintTx(responseData);
    if (!tx.to || !tx.data) {
      return res.status(502).json({ error: 'OpenSea mint response did not include transaction to/data.' });
    }

    return res.json({
      to: tx.to,
      data: tx.data,
      value: tx.value,
      chain: tx.chain,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Internal server error while requesting OpenSea Drops mint.',
    });
  }
});

/* ------------------------------------------------------------------
 * Frontend: Vite (React) in local dev via middleware mode, static dist in prod.
 * API routes above always take precedence.
 * ------------------------------------------------------------------ */
function attachProductionFrontend() {
  const distPath = path.join(process.cwd(), 'dist');
  const publicPath = path.join(process.cwd(), 'public');
  const staticPath = fs.existsSync(path.join(distPath, 'index.html'))
    ? distPath
    : publicPath;
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

async function startLocalServer() {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Rare People server running on http://0.0.0.0:${PORT} (whitelist: ${hasStore() ? 'vercel-blob' : 'local-storage'})`
    );
  });
}

if (IS_VERCEL || IS_PROD) {
  attachProductionFrontend();
} else {
  void startLocalServer();
}

export default app;
