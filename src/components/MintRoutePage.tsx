import { useCallback, useEffect, useMemo, useState } from 'react';
import { getActiveProvider, useWeb3 } from '../lib/web3';
import RareMark from './RareMark';

interface DropStage {
  uuid?: string | null;
  label: string;
  stageType?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  price?: string | number | null;
  maxPerWallet?: string | number | null;
  maxTotalMintableByWallet?: string | number | null;
  isActive?: boolean;
  windowStatus?: string;
  isEligible?: boolean | null;
  eligibilityStatus?: string | null;
  status: string;
}

interface DropPayload {
  collectionName?: string | null;
  collectionSlug?: string | null;
  contractAddress?: string | null;
  chain?: string | null;
  maxSupply?: string | number | null;
  totalSupply?: string | number | null;
  currentStage?: string | null;
  nextStage?: string | null;
  eligibilityLoaded?: boolean;
  eligibilityAuthRequired?: boolean;
  eligibilityAuthError?: string | null;
  stages?: DropStage[];
  error?: string;
}

const ERC721_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isReceiptSuccess(status: unknown): boolean {
  if (status === 1 || status === '1') return true;
  const raw = String(status || '').toLowerCase();
  return raw === '0x1' || raw === '0x01';
}

async function waitForReceipt(provider: any, hash: string): Promise<any> {
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    });
    if (receipt) return receipt;
    await sleep(1500);
  }
  throw new Error('Transaction is still pending. It was not marked successful.');
}

function parseMintedToken(receipt: any, minter: string): { contract: string; tokenId: string } | null {
  const wanted = minter.replace(/^0x/i, '').toLowerCase().padStart(64, '0');
  const logs: any[] = Array.isArray(receipt?.logs) ? receipt.logs : [];
  let fallback: { contract: string; tokenId: string } | null = null;
  for (const log of logs) {
    const topics: string[] = Array.isArray(log?.topics) ? log.topics : [];
    if (!topics[0] || topics[0].toLowerCase() !== ERC721_TRANSFER_TOPIC) continue;
    if (topics.length < 4 || !log?.address) continue;
    const tokenId = BigInt(topics[3]).toString();
    const parsed = { contract: String(log.address), tokenId };
    const toTopic = String(topics[2] || '').replace(/^0x/i, '').toLowerCase();
    if (toTopic === wanted) return parsed;
    if (!fallback) fallback = parsed;
  }
  return fallback;
}

function openSeaItemUrl(chain: string | null | undefined, contract: string, tokenId: string): string {
  const chainSlug = (chain || 'robinhood').trim() || 'robinhood';
  return `https://opensea.io/assets/${encodeURIComponent(chainSlug)}/${contract}/${tokenId}`;
}

function toUtf8Hex(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function requestPersonalSign(provider: any, account: string, message: string): Promise<string> {
  const hex = toUtf8Hex(message);
  const attempts: unknown[][] = [
    [message, account],
    [hex, account],
  ];
  let lastError: any;
  for (const params of attempts) {
    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params,
      });
      if (typeof signature === 'string' && signature.length > 20) return signature;
    } catch (err: any) {
      if (err?.code === 4001) throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('Eligibility check failed — please authenticate again.');
}

function stageWindowLabel(row: DropStage): string {
  const window = String(row.windowStatus || row.status || '').toUpperCase();
  if (window === 'UPCOMING' || window === 'INACTIVE') return 'UPCOMING';
  if (window === 'ENDED') return 'ENDED';
  return 'ACTIVE';
}

function leftEligibilityLabel(row: DropStage, connected: boolean, authBusy: boolean, authRequired: boolean): string | null {
  if (row.isEligible === true) return 'ELIGIBLE';
  if (row.isEligible === false) return 'NOT ELIGIBLE';
  if (authBusy) return 'CHECKING';
  if (!connected) return null;
  if (authRequired) return 'AUTH REQUIRED';
  return null;
}

function rightStageLabel(row: DropStage, connected: boolean, authBusy: boolean, authRequired: boolean): string {
  const window = stageWindowLabel(row);
  if (window === 'UPCOMING') return 'UPCOMING';
  if (window === 'ENDED') return 'ENDED';
  if (row.isEligible === true) return 'ELIGIBLE';
  if (row.isEligible === false) return 'NOT ELIGIBLE';
  if (authBusy) return 'CHECKING';
  if (authRequired) return 'AUTH REQUIRED';
  return 'ACTIVE';
}

function toCount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatPrice(stages: DropStage[], currentLabel: string | null): string {
  const current = stages.find((s) => s.isActive) || stages.find((s) => s.label === currentLabel) || stages[0];
  const raw = current?.price;
  if (raw === null || raw === undefined || raw === '') return '—';
  const n = Number(raw);
  if (Number.isFinite(n) && n === 0) return 'FREE';
  return String(raw);
}

function isRobinhoodChain(chainId: string | number | null | undefined): boolean {
  if (chainId === null || chainId === undefined) return false;
  const raw = String(chainId).toLowerCase();
  if (raw === '0x1237' || raw === '4663') return true;
  const n = raw.startsWith('0x') ? parseInt(raw, 16) : Number(raw);
  return n === 4663;
}

async function ensureRobinhoodChain(provider: any): Promise<void> {
  const current = await provider.request({ method: 'eth_chainId' });
  if (isRobinhoodChain(current)) return;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1237' }],
    });
  } catch (switchError: any) {
    if (switchError?.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x1237',
            chainName: 'Robinhood Chain',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'],
            blockExplorerUrls: ['https://robinhoodchain.blockscout.com'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }

  const after = await provider.request({ method: 'eth_chainId' });
  if (!isRobinhoodChain(after)) {
    throw new Error('WRONG NETWORK. Switch your wallet to Robinhood Chain (4663 / 0x1237).');
  }
}

export default function MintRoutePage() {
  const { isConnected, isConnecting, shortAccount, account, openConnectModal, walletType } = useWeb3();
  const [quantity, setQuantity] = useState(1);
  const [drop, setDrop] = useState<DropPayload | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [mintPhase, setMintPhase] = useState<'idle' | 'preparing' | 'signing' | 'confirming' | 'success'>('idle');
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [openSeaNftUrl, setOpenSeaNftUrl] = useState<string | null>(null);

  const loadDropEligibility = useCallback(async () => {
    try {
      const minter = account && isConnected ? account : '';
        const url = minter
        ? `/api/opensea/drop?minter=${encodeURIComponent(minter)}`
        : '/api/opensea/drop';
      const res = await fetch(url, { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) {
        setDrop(null);
        setEligibilityError(typeof data?.error === 'string' ? data.error : 'Drop data unavailable');
        return;
      }
      if (minter) {
        try {
          const eligRes = await fetch(`/api/opensea/eligibility?minter=${encodeURIComponent(minter)}`, {
            credentials: 'same-origin',
          });
          const eligData = await eligRes.json().catch(() => ({}));
          if (eligRes.ok && eligData?.eligibilityLoaded && Array.isArray(eligData.stages) && Array.isArray(data.stages)) {
            const norm = (value: unknown) =>
              String(value || '')
                .trim()
                .toLowerCase()
                .replace(/-/g, '');
            const byUuid = new Map<string, any>();
            for (const s of eligData.stages) {
              const key = norm(s?.uuid);
              if (key) byUuid.set(key, s);
            }
            data.stages = data.stages.map((stage: DropStage) => {
              const extra = stage.uuid ? byUuid.get(norm(stage.uuid)) : null;
              if (!extra) return stage;
              return {
                ...stage,
                isEligible: extra.isEligible === true ? true : extra.isEligible === false ? false : stage.isEligible,
                eligibilityStatus:
                  extra.isEligible === true
                    ? 'ELIGIBLE'
                    : extra.isEligible === false
                      ? 'NOT ELIGIBLE'
                      : stage.eligibilityStatus,
                maxTotalMintableByWallet: extra.maxTotalMintableByWallet ?? stage.maxTotalMintableByWallet,
              };
            });
            data.eligibilityLoaded = true;
            data.eligibilityAuthRequired = false;
          } else if (eligData?.eligibilityAuthRequired) {
            data.eligibilityAuthRequired = true;
            if (
              typeof eligData?.error === 'string' &&
              eligData.error &&
              !/jwt|bearer|cookie|signature|api[_-]?key|authorization/i.test(eligData.error)
            ) {
              data.eligibilityAuthError = eligData.error;
            }
          } else if (!eligRes.ok) {
            data.eligibilityAuthRequired = true;
            data.eligibilityAuthError = 'Eligibility check failed — please authenticate again.';
          }
        } catch {
          // Keep drop timing; do not invent eligibility.
        }
      }
      setDrop(data);
      if (typeof data?.eligibilityAuthError === 'string' && data.eligibilityAuthError) {
        setEligibilityError(data.eligibilityAuthError);
      } else {
        setEligibilityError(null);
      }
    } catch {
      setDrop(null);
      setEligibilityError('Could not load OpenSea drop details');
    }
  }, [account, isConnected]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadDropEligibility();
    })();
    const interval = window.setInterval(() => {
      if (!cancelled) loadDropEligibility();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadDropEligibility]);

  const stages = Array.isArray(drop?.stages) ? drop.stages : [];
  const minted = toCount(drop?.totalSupply);
  const maxSupply = toCount(drop?.maxSupply);
  const remaining =
    minted !== null && maxSupply !== null ? Math.max(0, maxSupply - minted) : null;
  const progressRatio =
    minted !== null && maxSupply !== null && maxSupply > 0
      ? Math.min(100, Math.max(0, (minted / maxSupply) * 100))
      : 0;

  const currentStage = drop?.currentStage || stages.find((s) => s.isActive)?.label || null;
  const nextStage = drop?.nextStage || null;
  const stageHeadline = currentStage
    ? `ACTIVE · ${currentStage.toUpperCase()}`
    : nextStage
      ? `UPCOMING · ${nextStage.toUpperCase()}`
      : 'NO ACTIVE STAGE';

  const activeStageMeta = useMemo(() => {
    return (
      stages.find((s) => s.isActive) ||
      stages.find((s) => s.label === currentStage) ||
      stages.find((s) => s.label === nextStage) ||
      null
    );
  }, [stages, currentStage, nextStage]);

  const maxQuantity = useMemo(() => {
    const perWallet = toCount(activeStageMeta?.maxPerWallet);
    const caps = [perWallet, remaining].filter((n): n is number => n !== null && n > 0);
    return caps.length ? Math.min(...caps) : 1;
  }, [activeStageMeta, remaining]);

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, maxQuantity)));
  }, [maxQuantity]);

  const mintedLabel =
    minted !== null && maxSupply !== null ? `${minted} / ${maxSupply}` : '—';
  const priceLabel = stages.length ? formatPrice(stages, currentStage) : '—';
  const mintBusy = mintPhase === 'preparing' || mintPhase === 'signing' || mintPhase === 'confirming';

  const requestEligibilityAuth = useCallback(async () => {
    if (authBusy) return;
    if (!isConnected || !account) {
      openConnectModal();
      return;
    }
    const provider = getActiveProvider(walletType);
    if (!provider?.request) {
      setAuthNotice('Connected wallet provider is not available.');
      return;
    }
    setAuthBusy(true);
    setAuthNotice(null);
    try {
      const nonceRes = await fetch(`/api/opensea/auth/siwe?address=${encodeURIComponent(account)}`, {
        credentials: 'same-origin',
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok || typeof nonceData?.message !== 'string') {
        throw new Error(typeof nonceData?.error === 'string' ? nonceData.error : 'Could not start eligibility check.');
      }
      const signature = await requestPersonalSign(provider, account, nonceData.message);
      const verifyRes = await fetch('/api/opensea/auth/siwe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account, signature }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        const step = typeof verifyData?.step === 'string' ? verifyData.step : 'siwe_verify';
        const status = typeof verifyData?.status === 'number' ? verifyData.status : verifyRes.status;
        throw new Error(`Eligibility check failed — please authenticate again. (${step} HTTP ${status})`);
      }
      await loadDropEligibility();
    } catch (err: any) {
      if (err?.code === 4001) {
        setAuthNotice(
          'Sign the OpenSea eligibility message in your wallet to see ELIGIBLE / NOT ELIGIBLE. This is not a mint transaction.'
        );
      } else {
        setAuthNotice(
          typeof err?.message === 'string' && err.message.includes('Eligibility check failed')
            ? err.message
            : 'Eligibility check failed — please authenticate again.'
        );
      }
    } finally {
      setAuthBusy(false);
    }
  }, [account, authBusy, isConnected, loadDropEligibility, openConnectModal, walletType]);

  const handleMintClick = async () => {
    if (!isConnected || !account || mintBusy) return;
    setMintError(null);
    setMintTxHash(null);
    setShowMintSuccess(false);
    setOpenSeaNftUrl(null);
    setMintPhase('preparing');

    try {
      const provider = getActiveProvider(walletType);
      if (!provider?.request) {
        throw new Error('Connected wallet provider is not available.');
      }

      await ensureRobinhoodChain(provider);

      const res = await fetch('/api/opensea/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minter: account,
          quantity,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof payload?.error === 'string' ? payload.error : 'Mint request failed.';
        if (res.status === 409) throw new Error(`409: ${msg}`);
        if (res.status === 422) throw new Error(`422: ${msg}`);
        throw new Error(msg);
      }

      const to = payload?.to;
      const data = payload?.data;
      const value = payload?.value;
      if (!to || !data) {
        throw new Error('OpenSea did not return transaction to/data.');
      }

      setMintPhase('signing');
      const txParams: Record<string, unknown> = {
        from: account,
        to,
        data,
      };
      if (value !== undefined) txParams.value = value;
      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      const txHash = typeof hash === 'string' ? hash : String(hash);
      if (!txHash || txHash === 'undefined' || txHash === 'null') {
        throw new Error('Wallet did not return a transaction hash.');
      }
      setMintTxHash(txHash);
      setMintPhase('confirming');

      const receipt = await waitForReceipt(provider, txHash);
      if (!isReceiptSuccess(receipt.status)) {
        throw new Error('Transaction failed on-chain. Mint was not completed.');
      }

      const mintedToken = parseMintedToken(receipt, account);
      const chain = drop?.chain || null;
      if (mintedToken) {
        setOpenSeaNftUrl(openSeaItemUrl(chain, mintedToken.contract, mintedToken.tokenId));
      } else {
        throw new Error('Transaction confirmed, but the minted token could not be read from the receipt.');
      }

      setMintPhase('success');
      setShowMintSuccess(true);
      await loadDropEligibility();
      window.setTimeout(() => {
        loadDropEligibility();
      }, 4000);
    } catch (err: any) {
      setMintPhase('idle');
      if (err?.code === 4001) {
        setMintError('Transaction rejected in wallet.');
        return;
      }
      setMintError(err?.message || 'Mint failed.');
    }
  };

  useEffect(() => {
    if (!showMintSuccess) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMintSuccess(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMintSuccess]);

  const publicStage = stages.find((s) => String(s.stageType || '').toLowerCase().includes('public'));
  const walletCapStage =
    stages.find((s) => s.isActive && s.maxTotalMintableByWallet != null) ||
    stages.find((s) => s.maxTotalMintableByWallet != null) ||
    null;
  const walletCap = walletCapStage?.maxTotalMintableByWallet ?? null;

  return (
    <div className="min-h-screen bg-[#eeeeee] text-[#111] flex flex-col font-['Archivo'] selection:bg-[#111] selection:text-[#eeeeee]">
      <header className="w-full border-b border-[#111] bg-[#eeeeee] sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-[#111] no-underline">
            <RareMark size={22} />
            <span className="font-['Silkscreen'] text-[15px] sm:text-[16px] tracking-tight">RARE PEOPLE</span>
          </a>

          <a
            href="/"
            className="rf-btn text-[12px] py-1.5 px-3 bg-[#eeeeee] hover:bg-[#e4e4e4]"
          >
            [ home ]
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[620px] space-y-6">
          <div className="bg-[#eeeeee] border border-[#111] p-6 sm:p-8 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] sm:text-[14px] uppercase tracking-[0.24em] font-medium text-[#111] font-['Sometype_Mono']">
              <span>{drop?.collectionName || 'RARE PEOPLE'}</span>
              <span className="text-[11px] tracking-[0.18em] text-[#666]">MINT PRICE · {priceLabel}</span>
            </div>

            <div className="w-full h-5 bg-[#d4d4d4] border border-[#111] overflow-hidden">
              <div
                className="h-full bg-[#111] transition-all duration-500"
                style={{ width: `${progressRatio}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-[12px] uppercase pt-0.5 font-['Sometype_Mono']">
              <span className="text-[#888] tracking-[0.26em]">MINTED</span>
              <span className="text-[#111] tracking-[0.22em]">{mintedLabel}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={openConnectModal}
              disabled={isConnecting}
              className="bg-[#141416] hover:bg-[#252528] text-[#ffffff] text-[12px] sm:text-[13px] uppercase tracking-[0.22em] px-6 py-2 border border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait font-['Sometype_Mono']"
            >
              {isConnecting ? (
                <span>CONNECTING...</span>
              ) : isConnected && shortAccount ? (
                <span>{shortAccount.toUpperCase()}</span>
              ) : (
                <span>CONNECT WALLET</span>
              )}
            </button>
          </div>

          <div className="bg-[#eeeeee] border border-[#111] p-6 sm:p-8">
            <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.26em] text-[#888] font-medium mb-3 font-['Sometype_Mono']">
              YOUR ELIGIBILITY
            </div>
            <div className="border border-[#111] px-4 py-3 mb-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#888] font-['Sometype_Mono'] mb-1">
                CURRENT STAGE
              </div>
              <div className="font-['Sometype_Mono'] text-[15px] sm:text-[16px] tracking-[0.16em] uppercase text-[#111] font-medium">
                {stageHeadline}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                requestEligibilityAuth();
              }}
              disabled={authBusy}
              className="w-full mb-4 py-2 px-3 text-[11px] sm:text-[12px] uppercase tracking-[0.18em] border border-[#111] bg-[#eeeeee] hover:bg-[#e4e4e4] font-['Sometype_Mono'] cursor-pointer disabled:opacity-60"
            >
              {authBusy ? 'CHECKING...' : 'AUTHENTICATE / CHECK ELIGIBILITY'}
            </button>

            <div className="space-y-3 text-[12px] sm:text-[13px] tracking-[0.2em] font-['Sometype_Mono']">
              {stages.map((row) => {
                const leftElig = leftEligibilityLabel(
                  row,
                  Boolean(isConnected && account),
                  authBusy,
                  Boolean(drop?.eligibilityAuthRequired)
                );
                const rightLabel = rightStageLabel(
                  row,
                  Boolean(isConnected && account),
                  authBusy,
                  Boolean(drop?.eligibilityAuthRequired)
                );
                return (
                <div key={row.uuid || row.label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center text-[#111] min-w-0">
                    <span
                      className={`w-2.5 h-2.5 inline-block mr-3 shrink-0 ${
                        row.isActive ? 'bg-[#111]' : 'bg-[#4c4c4e]'
                      }`}
                    />
                    <span className="font-medium truncate">{row.label}</span>
                    {leftElig ? (
                      <span
                        className={`ml-3 uppercase font-medium shrink-0 ${
                          leftElig === 'ELIGIBLE' ? 'text-[#111]' : 'text-[#888]'
                        }`}
                      >
                        {leftElig}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`uppercase font-medium text-right shrink-0 ${
                      rightLabel === 'ELIGIBLE' || rightLabel === 'ACTIVE'
                        ? 'text-[#111]'
                        : 'text-[#888]'
                    }`}
                  >
                    {rightLabel}
                  </span>
                </div>
                );
              })}
            </div>
            {publicStage ? (
              <p className="mt-4 text-[11px] font-['Sometype_Mono'] text-[#666] tracking-[0.08em] leading-relaxed uppercase">
                Public stage · {publicStage.status}
              </p>
            ) : null}
            {walletCap != null && walletCap !== '' ? (
              <p className="mt-2 text-[11px] font-['Sometype_Mono'] text-[#111] tracking-[0.12em] uppercase">
                Wallet mint cap · {String(walletCap)}
              </p>
            ) : null}
            {authNotice ? (
              <p className="mt-4 text-[11px] font-['Sometype_Mono'] text-[#888] tracking-[0.08em] leading-relaxed">
                {authNotice}
              </p>
            ) : null}
            {drop?.eligibilityAuthError ? (
              <p className="mt-4 text-[11px] font-['Sometype_Mono'] text-[#888] tracking-[0.08em] leading-relaxed">
                {drop.eligibilityAuthError}
              </p>
            ) : null}
            {eligibilityError ? (
              <p className="mt-4 text-[11px] font-['Sometype_Mono'] text-[#888] tracking-[0.08em] leading-relaxed">
                {eligibilityError}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-2.5 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-12 h-10 border border-[#b0b0b0] bg-transparent hover:border-[#111] text-[#666] hover:text-[#111] flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <div
              className="w-16 h-10 border border-[#b0b0b0] bg-transparent flex items-center justify-center text-[15px] font-bold text-[#111] font-['Sometype_Mono']"
              aria-live="polite"
            >
              {quantity}
            </div>

            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              className="w-12 h-10 border border-[#b0b0b0] bg-transparent hover:border-[#111] text-[#666] hover:text-[#111] flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleMintClick}
            disabled={!isConnected || mintBusy}
            className={`w-full py-3.5 sm:py-4 px-6 font-['Silkscreen'] text-[14px] sm:text-[16px] tracking-[0.16em] uppercase border border-[#111] shadow-[3px_3px_0_#111] ${
              isConnected && !mintBusy
                ? 'bg-[#ccff00] hover:bg-[#bbf000] text-[#111] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer'
                : 'bg-[#d4d4d4] text-[#888] cursor-not-allowed opacity-70'
            }`}
          >
            {mintPhase === 'preparing'
              ? 'PREPARING...'
              : mintPhase === 'signing'
                ? 'CONFIRM IN WALLET'
                : mintPhase === 'confirming'
                  ? 'CONFIRMING...'
                  : mintPhase === 'success'
                    ? 'MINTED'
                    : 'MINT'}
          </button>
          {mintError ? (
            <p className="text-center text-[11px] sm:text-[12px] font-['Sometype_Mono'] text-[#888] tracking-[0.08em] leading-relaxed">
              {mintError}
            </p>
          ) : null}
          {mintTxHash && mintPhase === 'success' ? (
            <p className="text-center text-[11px] sm:text-[12px] font-['Sometype_Mono'] text-[#111] tracking-[0.08em] break-all">
              TX {mintTxHash}
            </p>
          ) : null}
          {mintTxHash && mintPhase === 'confirming' ? (
            <p className="text-center text-[11px] sm:text-[12px] font-['Sometype_Mono'] text-[#888] tracking-[0.08em]">
              Waiting for on-chain confirmation...
            </p>
          ) : null}
        </div>
      </main>

      {showMintSuccess && openSeaNftUrl ? (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mint-complete-title"
          onClick={() => setShowMintSuccess(false)}
        >
          <div
            className="relative w-full max-w-[420px] bg-[#f4f4f4] border border-[#111] px-6 sm:px-8 pt-8 pb-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowMintSuccess(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-[#111] text-lg cursor-pointer bg-transparent border-0"
              aria-label="Close"
            >
              ×
            </button>
            <h2
              id="mint-complete-title"
              className="font-['Silkscreen'] text-[16px] sm:text-[18px] tracking-[0.14em] uppercase text-[#111] mb-5"
            >
              MINT COMPLETE!
            </h2>
            <div className="mx-auto mb-5 w-[168px] h-[168px] bg-[#111] border border-[#111] flex items-center justify-center">
              <RareMark size={148} className="border-0 shadow-none bg-transparent" />
            </div>
            <p className="font-['Silkscreen'] text-[13px] sm:text-[14px] tracking-[0.12em] uppercase text-[#111] mb-2">
              CONGRATULATIONS!
            </p>
            <p className="font-['Archivo'] text-[13px] sm:text-[14px] text-[#444] mb-6 leading-snug">
              You have successfully minted your Rare People NFT.
            </p>
            <a
              href={openSeaNftUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#141416] hover:bg-[#252528] text-[#ffffff] font-['Sometype_Mono'] text-[12px] sm:text-[13px] uppercase tracking-[0.18em] no-underline border border-[#111]"
            >
              VIEW ON OPENSEA
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
