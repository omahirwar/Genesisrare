import { list, put } from '@vercel/blob';

export interface WalletRecord {
  wallet: string;
  submittedAt: string;
}

export const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;
const BLOB_PATH = 'whitelist.json';

function getToken(): string {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.ARC_BLOB_READ_WRITE_TOKEN ||
    process.env.ARCPIXLS_BLOB_READ_WRITE_TOKEN ||
    Object.entries(process.env).find(([k, v]) => k.endsWith('_READ_WRITE_TOKEN') && typeof v === 'string' && v.length > 0)?.[1];
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is missing.');
  }
  return token;
}

let cachedWallets: WalletRecord[] = [];
let lastFetchTime = 0;
const BLOB_CACHE_TTL_MS = 60 * 1000; // 60s cache to avoid hitting Vercel Blob limits

async function readAll(token: string, forceRefresh = false): Promise<WalletRecord[]> {
  if (!forceRefresh && cachedWallets.length > 0 && Date.now() - lastFetchTime < BLOB_CACHE_TTL_MS) {
    return cachedWallets;
  }

  try {
    const { blobs } = await list({ prefix: BLOB_PATH, token });
    const existing = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!existing) return cachedWallets;

    const fetchUrl = (existing as any).downloadUrl || existing.url;
    const res = await fetch(`${fetchUrl}?ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const fallbackRes = await fetch(`${existing.url}?ts=${Date.now()}`, { cache: 'no-store' });
      if (!fallbackRes.ok) return cachedWallets;
      const data = await fallbackRes.json();
      if (Array.isArray(data)) {
        cachedWallets = data as WalletRecord[];
        lastFetchTime = Date.now();
      }
      return cachedWallets;
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      cachedWallets = data as WalletRecord[];
      lastFetchTime = Date.now();
    }
    return cachedWallets;
  } catch (e: any) {
    console.warn('readAll error or limit reached, returning cached wallets:', e?.message || e);
    return cachedWallets;
  }
}

async function writeWallets(wallets: WalletRecord[], token: string): Promise<void> {
  const payload = JSON.stringify(wallets, null, 2);
  cachedWallets = wallets;
  lastFetchTime = Date.now();

  try {
    await put(BLOB_PATH, payload, {
      access: 'public',
      token,
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (putErr: any) {
    // If private blob store
    if (putErr?.message?.includes('does not allow public') || putErr?.message?.includes('private')) {
      await put(BLOB_PATH, payload, {
        access: 'private' as any,
        token,
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } else {
      throw putErr;
    }
  }
}

const GOOGLE_SCRIPT_WEBAPP_URL =
  process.env.GOOGLE_SCRIPT_WEBAPP_URL ||
  'https://script.google.com/macros/s/AKfycbxF7V00wAh-7hL9i4EP6MIGVLWQtNGY8wtl362nZqphwOS-c5twihlCN8ETO-ifs3l_/exec';

// Fast per-wallet cache (30s TTL)
const walletCheckCache = new Map<
  string,
  { whitelisted: boolean; spot?: number; total?: number; timestamp: number }
>();

async function addToGoogleScript(wallet: string): Promise<{ ok: boolean; already?: boolean; spot?: number; total?: number }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    console.warn('Google Script append error:', err?.message || err);
  }
  return { ok: false };
}

async function checkGoogleScript(wallet: string): Promise<{ whitelisted: boolean; spot?: number; total?: number } | null> {
  const trimmed = wallet.toLowerCase().trim();

  const cached = walletCheckCache.get(trimmed);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return {
      whitelisted: cached.whitelisted,
      spot: cached.spot,
      total: cached.total,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${GOOGLE_SCRIPT_WEBAPP_URL}?wallet=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.whitelisted === 'boolean') {
        const result = {
          whitelisted: data.whitelisted,
          spot: data.spot || 1,
          total: data.total || 0,
          timestamp: Date.now(),
        };
        walletCheckCache.set(trimmed, result);
        return result;
      }
    }
  } catch {
    // Return null if request fails/times out
  }

  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const checkAddress = req.query?.check || req.query?.wallet;
      let token: string | null = null;
      let wallets: WalletRecord[] = [];
      try {
        token = getToken();
        wallets = await readAll(token);
      } catch {
        // Blob store not configured or unavailable
      }

      if (checkAddress && typeof checkAddress === 'string') {
        const trimmed = checkAddress.trim().toLowerCase();
        const index = wallets.findIndex((w) => w.wallet.toLowerCase() === trimmed);
        if (index !== -1) {
          return res.status(200).json({
            whitelisted: true,
            wallet: wallets[index].wallet,
            submittedAt: wallets[index].submittedAt,
            spot: index + 1,
            total: wallets.length,
          });
        }

        // Check Google Sheet script live
        const gScript = await checkGoogleScript(trimmed);
        if (gScript && gScript.whitelisted) {
          return res.status(200).json({
            whitelisted: true,
            wallet: checkAddress.trim(),
            spot: gScript.spot || 1,
            total: Math.max(wallets.length, gScript.total || 1),
          });
        }

        return res.status(200).json({
          whitelisted: false,
          wallet: checkAddress.trim(),
          total: wallets.length,
        });
      }
      return res.status(200).json({ status: 'ok', count: wallets.length });
    } catch (err: any) {
      return res.status(200).json({ status: 'ok', count: 0, note: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }

      const wallet = typeof body?.wallet === 'string' ? body.wallet.trim() : '';

      if (!EVM_REGEX.test(wallet)) {
        return res.status(400).json({ error: 'Enter a valid EVM address (0x followed by 40 hex characters).' });
      }

      const token = getToken();
      const wallets = await readAll(token);

      // Support action: 'check'
      if (body?.action === 'check') {
        const trimmed = wallet.toLowerCase();
        const index = wallets.findIndex((w) => w.wallet.toLowerCase() === trimmed);
        if (index !== -1) {
          return res.status(200).json({
            whitelisted: true,
            wallet: wallets[index].wallet,
            submittedAt: wallets[index].submittedAt,
            spot: index + 1,
            total: wallets.length,
          });
        }
        return res.status(200).json({
          whitelisted: false,
          wallet,
          total: wallets.length,
        });
      }

      if (wallets.some((w) => w.wallet.toLowerCase() === wallet.toLowerCase())) {
        return res.status(200).json({ ok: true, message: 'Wallet already on whitelist', total: wallets.length });
      }

      // Save directly to Google Sheet Web App
      const gResult = await addToGoogleScript(wallet);
      if (gResult.already) {
        return res.status(200).json({ ok: true, message: 'Wallet already on whitelist', total: gResult.total || wallets.length });
      }

      const record: WalletRecord = {
        wallet,
        submittedAt: new Date().toISOString(),
      };
      wallets.push(record);

      try {
        await writeWallets(wallets, token);
      } catch (writeErr: any) {
        console.warn('Blob store write fallback (saved to Google Sheet):', writeErr?.message);
      }

      return res.status(201).json({
        ok: true,
        submittedAt: record.submittedAt,
        spot: gResult.spot || wallets.length,
        total: gResult.total || wallets.length,
      });
    } catch (err: any) {
      console.error('Error in /api/whitelist:', err);
      return res.status(500).json({ error: err?.message || 'Storage error while saving wallet submission.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
