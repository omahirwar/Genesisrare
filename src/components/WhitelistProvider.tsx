import { useCallback, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { springPop, EASE_OUT } from '../lib/motion';
import RareMark from './RareMark';
import { SUPPLY } from '../data/content';
import { WhitelistCtx } from './whitelist-context';
import { useWeb3 } from '../lib/web3';
import WLCheckerModal from './WLCheckerModal';
import { SHOW_UNDER_REVIEW_ON_SUBMIT } from '../lib/config';
import { Wallet, Check, AlertCircle, Clock } from 'lucide-react';

const EVM = /^0x[a-fA-F0-9]{40}$/;

type Status = 'idle' | 'loading' | 'done' | 'error';

export function WhitelistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [isCheckerOpen, setCheckerOpen] = useState(false);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const openChecker = useCallback(() => setCheckerOpen(true), []);
  const closeChecker = useCallback(() => setCheckerOpen(false), []);

  return (
    <WhitelistCtx.Provider value={{ open, openChecker }}>
      {children}
      <AnimatePresence>{isOpen && <Dialog onClose={close} />}</AnimatePresence>
      <AnimatePresence>
        {isCheckerOpen && <WLCheckerModal isOpen={isCheckerOpen} onClose={closeChecker} />}
      </AnimatePresence>
    </WhitelistCtx.Provider>
  );
}

function Dialog({ onClose }: { onClose: () => void }) {
  const { account, isConnected } = useWeb3();
  const [wallet, setWallet] = useState(account || '');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [already, setAlready] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (account && !wallet) {
      setWallet(account);
    }
  }, [account, wallet]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const w = wallet.trim();
    if (!EVM.test(w)) {
      setError('Invalid EVM address. Paste a 0x address (42 characters).');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setStatus('loading');
    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: w }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        setTotal(typeof data.total === 'number' ? data.total : null);
        setStatus('done');
      } else if (res.status === 409) {
        setAlready(true);
        setStatus('done');
      } else {
        const rawErr = data.error || 'Something went wrong. Try again.';
        if (rawErr.toLowerCase().includes('suspended') || rawErr.toLowerCase().includes('blob')) {
          setError('Storage limit reached. Re-connecting storage, please try again.');
        } else {
          setError(rawErr);
        }
        setStatus('error');
      }
    } catch {
      setError('Network error. Check your connection and retry.');
      setStatus('error');
    }
  }

  const done = status === 'done';

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/60"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wl-title"
        className="relative z-10 w-full max-w-[480px] bg-[#eeeeee] border-2 border-[#111] shadow-[6px_6px_0_0_#111] p-6 sm:p-8 my-auto text-left"
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: springPop }}
        exit={{ opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.15 } }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rf-btn text-[12px] py-1 px-2.5 bg-[#eeeeee] hover:bg-[#e4e4e4]"
        >
          [ close ✕ ]
        </button>

        {!done ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#111]">
              <RareMark size={20} />
              <span className="font-['Silkscreen'] text-[15px] text-[#111]">JOIN WHITELIST</span>
            </div>

            <div>
              <h3 id="wl-title" className="font-['Silkscreen'] text-[18px] text-[#111]">
                RESERVE YOUR SPOT
              </h3>
              <p className="font-['Archivo'] text-[#444] text-[14px] leading-relaxed mt-1">
                Enter your Robinhood EVM wallet to reserve your spot for the <strong>21 September 2026</strong> Rare People drop.
              </p>
            </div>

            {/* Quick-fill connected wallet */}
            {isConnected && account && wallet.toLowerCase() !== account.toLowerCase() && (
              <button
                type="button"
                onClick={() => {
                  setWallet(account);
                  setError('');
                }}
                className="rf-btn text-[11px] py-1 px-2 bg-[#eeeeee] flex items-center gap-1.5"
              >
                <Wallet className="w-3 h-3 text-[#111]" />
                <span>[ fill connected: {account.slice(0, 6)}...{account.slice(-4)} ]</span>
              </button>
            )}

            <div>
              <label htmlFor="wl-wallet" className="block rf-label mb-1">
                robinhood wallet address (0x...)
              </label>
              <input
                id="wl-wallet"
                ref={inputRef}
                value={wallet}
                onChange={(e) => {
                  setWallet(e.target.value);
                  if (error) setError('');
                }}
                placeholder="0x... paste your robinhood evm address"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3.5 py-2.5 font-['Sometype_Mono'] text-[13px] bg-[#fff] text-[#111] border border-[#111] outline-none"
              />
              {error && (
                <div className="mt-2 text-[12px] font-['Sometype_Mono'] text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rf-btn rf-btn-dark flex-1 text-[13px] py-2.5"
              >
                {status === 'loading' ? '[ saving spot... ]' : '[ submit wallet ]'}
              </button>
            </div>

            <div className="rf-label text-center pt-2">
              {SUPPLY.toLocaleString()} total supply · robinhood evm · mint 21 sep
            </div>
          </form>
        ) : SHOW_UNDER_REVIEW_ON_SUBMIT ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#111]">
              <RareMark size={20} />
              <span className="font-['Silkscreen'] text-[15px] text-[#111]">
                STATUS: UNDER REVIEW
              </span>
            </div>

            <div className="p-4 border-2 border-[#b45309] bg-[#fffbeb] font-['Sometype_Mono'] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#854d0e] font-bold">SUBMITTED WALLET</span>
                <span className="px-2 py-0.5 bg-[#fef08a] border border-[#854d0e] text-[#854d0e] text-[10px] font-bold flex items-center gap-1 font-['Silkscreen']">
                  <Clock className="w-3 h-3" />
                  UNDER REVIEW
                </span>
              </div>
              <div className="text-[13px] text-[#111] font-mono break-all font-bold">{wallet.trim()}</div>
              <div className="text-[11px] text-[#92400e] pt-1">
                {already
                  ? 'Address already submitted · Currently under review for final allocation'
                  : total !== null
                  ? `Submission recorded (#${total.toLocaleString()}) · Under review for 21 Sep drop`
                  : 'Submission recorded · Under review for 21 Sep drop'}
              </div>
            </div>

            <p className="font-['Archivo'] text-[14px] text-[#444] leading-relaxed">
              Your Robinhood EVM address has been received and is currently <strong>Under Review</strong>. Final whitelist spots will be confirmed before the <strong>21 September 2026</strong> mint.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="rf-btn rf-btn-dark w-full text-[13px] py-2 cursor-pointer"
            >
              [ close ]
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#111]">
              <RareMark size={20} />
              <span className="font-['Silkscreen'] text-[15px] text-[#111]">
                {already ? 'ALREADY ON LIST' : 'SPOT RESERVED'}
              </span>
            </div>

            <div className="p-4 border border-[#111] bg-[#f7f7f7] font-['Sometype_Mono'] space-y-2">
              <div className="text-[11px] text-[#888]">REGISTERED WALLET</div>
              <div className="text-[13px] text-[#111] font-mono break-all">{wallet.trim()}</div>
              {total !== null && !already && (
                <div className="text-[11px] text-green-700 pt-1 font-bold">
                  Verified entry #{total.toLocaleString()} · Priority Mint 21 Sep
                </div>
              )}
            </div>

            <p className="font-['Archivo'] text-[14px] text-[#444]">
              {already
                ? 'This wallet is already enrolled on the priority list. You are good to go for 21 Sep.'
                : 'Your address is safely stored in our database. Whitelist mint opens 21 September 2026 on Robinhood chain.'}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="rf-btn rf-btn-dark w-full text-[13px] py-2"
            >
              [ done ]
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
