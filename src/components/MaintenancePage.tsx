import RareMark from './RareMark';
import { AlertTriangle, Wrench, ShieldCheck, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#eeeeee] text-[#111] flex flex-col justify-between font-['Archivo'] selection:bg-[#111] selection:text-[#eeeeee] p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b-2 border-[#111]">
        <div className="flex items-center gap-3">
          <RareMark size={32} />
          <div>
            <span className="font-['Silkscreen'] text-[18px] sm:text-[20px] tracking-tight block">
              RARE PEOPLE // GENESIS
            </span>
            <span className="font-['Sometype_Mono'] text-[11px] text-[#666]">
              ROBINHOOD EVM · 4,444 RARE PEOPLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span className="font-['Silkscreen'] text-[11px] sm:text-[12px] bg-[#fef3c7] border border-[#d97706] text-[#92400e] px-2.5 py-1 font-bold">
            [ SYSTEM MAINTENANCE ]
          </span>
        </div>
      </header>

      {/* Center Maintenance Card */}
      <main className="max-w-2xl w-full mx-auto my-12">
        <div className="bg-[#fff] border-2 border-[#111] shadow-[8px_8px_0_0_#111] p-6 sm:p-10 text-left space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#111]">
            <div className="w-10 h-10 bg-[#fef3c7] border border-[#d97706] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-[#92400e]" />
            </div>
            <div>
              <div className="font-['Silkscreen'] text-[18px] sm:text-[22px] text-[#111] leading-tight">
                UNDER MAINTENANCE
              </div>
              <div className="font-['Sometype_Mono'] text-[12px] text-[#666]">
                EMERGENCY SYSTEM UPGRADE IN PROGRESS
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#fffbeb] border border-[#f59e0b] text-[#78350f] font-['Sometype_Mono'] text-[13px] leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold font-['Silkscreen'] text-[12px] text-[#92400e]">
              <AlertTriangle className="w-4 h-4 text-[#d97706]" />
              <span>TEMPORARY SYSTEM LOCKOUT</span>
            </div>
            <p>
              The Rare People portal and whitelist registration systems have been temporarily paused for scheduled database maintenance and allocation audits.
            </p>
          </div>

          <div className="space-y-3 font-['Sometype_Mono'] text-[13px]">
            <div className="p-3 bg-[#f5f5f5] border border-[#ddd] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#111] block">Your Allocations Are Safe</span>
                <span className="text-[#555] text-[12px]">
                  All previously submitted wallets, Google Sheets snapshots, and priority spots are securely preserved. No records have been lost.
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#f5f5f5] border border-[#ddd] flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5 animate-spin" />
              <div>
                <span className="font-bold text-[#111] block">Engineers On Deck</span>
                <span className="text-[#555] text-[12px]">
                  Our team is performing necessary security audits and syncing final snapshots for the 21 September drop. Normal operations will resume shortly.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#eee] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rf-btn rf-btn-dark text-[13px] py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>[ refresh status ]</span>
              </button>
              <a
                href="https://x.com/RarePeoplesNFT"
                target="_blank"
                rel="noopener noreferrer"
                className="rf-btn bg-[#fff] hover:bg-[#eee] border border-[#111] text-[#111] text-[13px] py-2.5 px-4 flex items-center justify-center gap-1.5"
              >
                <span className="font-bold">𝕏</span>
                <span>@RarePeoplesNFT</span>
              </a>
            </div>
            <span className="font-['Sometype_Mono'] text-[11px] text-[#888] text-center">
              SYSTEM STATUS: 503 SERVICE UNAVAILABLE
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto pt-6 border-t-2 border-[#111] flex flex-col sm:flex-row items-center justify-between gap-3 font-['Sometype_Mono'] text-[11px] text-[#666]">
        <span>RARE PEOPLE // PROTOCOL SECURITY & AUDIT</span>
        <span>MINT DATE: 21 SEP 2026 · ROBINHOOD CHAIN</span>
      </footer>
    </div>
  );
}
