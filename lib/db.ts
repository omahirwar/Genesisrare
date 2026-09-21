import { list, put } from '@vercel/blob';

/**
 * Interface representing a whitelisted wallet record stored in Vercel Blob.
 */
export interface WalletRecord {
  wallet: string;
  submittedAt: string;
}

/**
 * EVM Wallet Address Regular Expression (0x followed by 40 hex characters)
 */
export const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * All whitelist submissions live in a single JSON file in the project's
 * Vercel Blob store. It's readable straight from the Vercel dashboard
 * (Storage → your Blob store → whitelist.json).
 */
const BLOB_PATH = 'whitelist.json';

/**
 * The Blob read/write token. On Vercel this is injected automatically once a
 * Blob store is connected to the project (Storage tab). Locally, set
 * BLOB_READ_WRITE_TOKEN in your .env to talk to the same store.
 */
function getToken(): string {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.ARC_BLOB_READ_WRITE_TOKEN ||
    process.env.ARCPIXLS_BLOB_READ_WRITE_TOKEN ||
    Object.entries(process.env).find(([k, v]) => k.endsWith('_READ_WRITE_TOKEN') && typeof v === 'string' && v.length > 0)?.[1];
  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is missing. Connect a Vercel Blob store to the project (Storage tab) or set it in .env.'
    );
  }
  return token;
}

/**
 * Reads the current list of wallets from the Blob store.
 * Returns an empty array when nothing has been submitted yet.
 */
async function readAll(): Promise<WalletRecord[]> {
  const token = getToken();

  // Find the whitelist.json blob (if it exists yet).
  const { blobs } = await list({ prefix: BLOB_PATH, token });
  const existing = blobs.find((b) => b.pathname === BLOB_PATH);
  if (!existing) return [];

  // Fetch its contents. `cache: 'no-store'` keeps reads fresh so we don't
  // append onto a stale snapshot. Supports both public and private blobs.
  const fetchUrl = (existing as any).downloadUrl || existing.url;
  const res = await fetch(`${fetchUrl}?ts=${Date.now()}`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    // Fallback try standard url if downloadUrl failed
    const fallbackRes = await fetch(`${existing.url}?ts=${Date.now()}`, { cache: 'no-store' });
    if (!fallbackRes.ok) return [];
    try {
      const data = await fallbackRes.json();
      return Array.isArray(data) ? (data as WalletRecord[]) : [];
    } catch {
      return [];
    }
  }

  try {
    const data = await res.json();
    return Array.isArray(data) ? (data as WalletRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a new EVM wallet to the whitelist.json blob.
 * Validates the format and rejects case-insensitive duplicates.
 */
export async function insertWallet(wallet: string): Promise<WalletRecord> {
  const token = getToken();
  const trimmed = wallet.trim();

  // Validate EVM format
  if (!EVM_REGEX.test(trimmed)) {
    throw new Error('INVALID_ADDRESS');
  }

  const wallets = await readAll();

  // Reject duplicates (case-insensitive)
  if (wallets.some((w) => w.wallet.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('DUPLICATE_WALLET');
  }

  const record: WalletRecord = {
    wallet: trimmed,
    submittedAt: new Date().toISOString(),
  };
  wallets.push(record);

  // Write the updated list back. addRandomSuffix:false keeps the pathname
  // stable at whitelist.json; allowOverwrite lets us replace it each time.
  try {
    await put(BLOB_PATH, JSON.stringify(wallets, null, 2), {
      access: 'public',
      token,
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (putErr: any) {
    // If user created a Private Blob store, fallback to private access
    if (putErr?.message?.includes('does not allow public') || putErr?.message?.includes('private')) {
      await put(BLOB_PATH, JSON.stringify(wallets, null, 2), {
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

  return record;
}

/**
 * Retrieves all whitelisted wallets, newest first.
 */
export async function getWhitelistedWallets(): Promise<{ count: number; wallets: WalletRecord[] }> {
  const wallets = await readAll();
  const sorted = [...wallets].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  return {
    count: sorted.length,
    wallets: sorted,
  };
}

/**
 * Checks if a specific wallet is present on the whitelist.
 */
export async function checkWallet(wallet: string): Promise<{
  whitelisted: boolean;
  wallet: string;
  submittedAt?: string;
  spot?: number;
  total: number;
}> {
  const trimmed = wallet.trim().toLowerCase();
  const wallets = await readAll();
  const index = wallets.findIndex((w) => w.wallet.toLowerCase() === trimmed);
  if (index !== -1) {
    return {
      whitelisted: true,
      wallet: wallets[index].wallet,
      submittedAt: wallets[index].submittedAt,
      spot: index + 1,
      total: wallets.length,
    };
  }
  return {
    whitelisted: false,
    wallet,
    total: wallets.length,
  };
}
