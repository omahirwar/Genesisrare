import { roadmap } from '../data/content';

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-12 sm:py-16 bg-[#eeeeee] border-t border-[#111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#111]">
          <div className="space-y-1">
            <div className="rf-label">development milestones · delivery</div>
            <h2 className="font-['Silkscreen'] text-[22px] sm:text-[28px] text-[#111]">
              EXECUTION ROADMAP
            </h2>
          </div>
          <div className="rf-signal-tag">
            2026 delivery
          </div>
        </div>

        {/* 4-Box Contiguous Timeline */}
        <div className="border border-[#111] bg-[#eeeeee] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#111]">
          {roadmap.map((r, i) => (
            <div key={r.no} className="p-5 flex flex-col justify-between space-y-4 bg-[#eeeeee]">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2">
                  <span className="font-['Silkscreen'] text-[18px] text-[#111]">
                    #{r.no}
                  </span>
                  {i === 0 ? (
                    <span className="rf-signal-tag text-[10px]">active</span>
                  ) : (
                    <span className="font-['Sometype_Mono'] text-[11px] text-[#777]">[ scheduled ]</span>
                  )}
                </div>

                <h3 className="font-['Silkscreen'] text-[13px] sm:text-[14px] text-[#111] leading-snug pt-1">
                  {r.title}
                </h3>

                <p className="font-['Archivo'] text-[13px] text-[#555] leading-relaxed mt-2">
                  {r.body}
                </p>
              </div>

              <div className="font-['Sometype_Mono'] text-[11px] text-[#888] pt-2 border-t border-dashed border-[#ccc]">
                Robinhood EVM · Phase 0{i + 1}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
