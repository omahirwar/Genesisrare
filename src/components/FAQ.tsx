import { useState } from 'react';
import { faqs } from '../data/content';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <section id="faq" className="py-12 sm:py-16 bg-[#eeeeee] border-t border-[#111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#111]">
          <div className="space-y-1">
            <div className="rf-label">knowledge base · details</div>
            <h2 className="font-['Silkscreen'] text-[22px] sm:text-[28px] text-[#111]">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>
          <div className="rf-signal-tag">
            support & docs
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3 max-w-[880px]">
          {faqs.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className="border border-[#111] bg-[#eeeeee] shadow-[2px_2px_0_0_#111]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#e6e6e6] transition-colors cursor-pointer select-none"
                >
                  <span className="font-['Silkscreen'] text-[14px] sm:text-[15px] text-[#111]">
                    {f.q}
                  </span>
                  <span className="font-['Sometype_Mono'] text-[14px] font-bold text-[#111] shrink-0">
                    {isOpen ? '[ − ]' : '[ + ]'}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-1 font-['Archivo'] text-[14px] text-[#444] leading-relaxed border-t border-dashed border-[#111]">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
