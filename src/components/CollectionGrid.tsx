import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { allMicroNfts, type Nft, type Rarity, RARITY, RARITY_ORDER } from '../data/nfts';
import { SUPPLY } from '../data/content';
import { useWhitelist } from './whitelist-context';
import SectionHeading from './ui/SectionHeading';
import MicroPixlCard from './MicroPixlCard';
import PixlInspectorModal from './PixlInspectorModal';
import PixelButton from './ui/PixelButton';

type DensityMode = 'ultra' | 'compact';

export default function CollectionGrid() {
  const { open: openWhitelist } = useWhitelist();
  const [selectedRarity, setSelectedRarity] = useState<'All' | Rarity>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [density, setDensity] = useState<DensityMode>('ultra');
  const [hoveredNft, setHoveredNft] = useState<Nft | null>(null);
  const [inspectingNft, setInspectingNft] = useState<Nft | null>(null);

  // Filter list by rarity and search
  const filteredNfts = useMemo(() => {
    return allMicroNfts.filter((nft) => {
      const matchRarity = selectedRarity === 'All' || nft.rarity === selectedRarity;
      const matchQuery =
        !searchQuery.trim() ||
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.id.includes(searchQuery.trim()) ||
        Object.values(nft.traits).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRarity && matchQuery;
    });
  }, [selectedRarity, searchQuery]);

  // Handle previous / next navigation in modal
  const currentIndex = inspectingNft
    ? filteredNfts.findIndex((n) => n.id === inspectingNft.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredNfts.length - 1;

  const handlePrev = () => {
    if (hasPrev) setInspectingNft(filteredNfts[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) setInspectingNft(filteredNfts[currentIndex + 1]);
  };

  // Active preview item (hovered item or fallback to first visible item)
  const previewItem = hoveredNft || inspectingNft || filteredNfts[0] || allMicroNfts[0];

  return (
    <section id="collection" className="relative py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1300px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading
            title="THE RARE PEOPLE"
            sub="4,444 hand-placed 32×32 pixel characters. Micro-sized collectible matrix — hover or click any Rare Person to inspect."
          />

          {/* Quick Counter Badge */}
          <div className="flex items-center gap-3">
            <span
              className="sticker rounded-chip bg-paper px-3 py-1.5 font-display text-[11px] text-ink"
            >
              SHOWING <span className="text-blue-600 font-bold">{filteredNfts.length}</span> / {SUPPLY}
            </span>
          </div>
        </div>

        {/* Filter & Density Toolbar */}
        <div className="mt-8 flex flex-col gap-4 rounded-panel bg-paper p-3.5 sm:p-4 sticker">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Rarity Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedRarity('All')}
                className={`rounded-chip px-3 py-1 font-display text-[11px] transition-transform ${
                  selectedRarity === 'All'
                    ? 'bg-ink text-paper shadow-[2px_2px_0_var(--color-ink)]'
                    : 'bg-cream text-ink hover:bg-cream-2'
                }`}
                style={{ border: '2px solid var(--color-ink)' }}
              >
                ALL ({allMicroNfts.length})
              </button>

              {RARITY_ORDER.map((r) => {
                const count = allMicroNfts.filter((n) => n.rarity === r).length;
                const active = selectedRarity === r;
                const conf = RARITY[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRarity(r)}
                    className={`rounded-chip px-2.5 py-1 font-display text-[11px] flex items-center gap-1.5 transition-transform ${
                      active ? 'scale-105 shadow-[2px_2px_0_var(--color-ink)]' : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: active ? conf.bg : 'var(--color-cream)',
                      color: active ? conf.fg : 'var(--color-ink)',
                      border: '2px solid var(--color-ink)',
                    }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: conf.bg, border: '1px solid var(--color-ink)' }}
                    />
                    {r.toUpperCase()} ({count})
                  </button>
                );
              })}
            </div>

            {/* Density & Search Controls */}
            <div className="flex items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter #ID or trait…"
                  className="rounded-chip bg-cream px-3 py-1 font-sans text-[12px] text-ink outline-none placeholder:text-ink-soft w-36 sm:w-44"
                  style={{ border: '2px solid var(--color-ink)' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Grid Density Toggle */}
              <div className="hidden sm:flex items-center gap-1 rounded-chip bg-cream p-0.5" style={{ border: '2px solid var(--color-ink)' }}>
                <button
                  type="button"
                  onClick={() => setDensity('ultra')}
                  title="Ultra Micro Grid (12 cols)"
                  className={`rounded-chip px-2 py-0.5 font-display text-[10px] transition-all ${
                    density === 'ultra' ? 'bg-ink text-paper' : 'text-ink hover:text-ink-soft'
                  }`}
                >
                  ULTRA MICRO
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  title="Compact Grid (8 cols)"
                  className={`rounded-chip px-2 py-0.5 font-display text-[10px] transition-all ${
                    density === 'compact' ? 'bg-ink text-paper' : 'text-ink hover:text-ink-soft'
                  }`}
                >
                  COMPACT
                </button>
              </div>
            </div>
          </div>

          {/* Retro Live HUD / Hover Inspector Bar */}
          {previewItem && (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs"
              style={{
                backgroundColor: 'var(--color-cream-2)',
                border: '2px dashed var(--color-ink)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 shrink-0 overflow-hidden rounded border border-ink bg-paper p-0.5"
                >
                  <img
                    src={previewItem.image}
                    alt={previewItem.name}
                    className="pixelated h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-ink text-[12px]">
                      #{previewItem.id} — {previewItem.short}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.2 text-[9px] font-display font-bold"
                      style={{
                        backgroundColor: RARITY[previewItem.rarity].bg,
                        color: RARITY[previewItem.rarity].fg,
                        border: '1px solid var(--color-ink)',
                      }}
                    >
                      {previewItem.rarity}
                    </span>
                  </div>
                  <div className="font-sans text-[11px] text-ink-soft truncate max-w-[280px] sm:max-w-[480px]">
                    {Object.entries(previewItem.traits)
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingNft(previewItem)}
                className="sticker rounded-chip bg-paper px-3 py-1 font-display text-[10px] text-ink hover:bg-cream active:translate-y-0.5"
              >
                INSPECT DETAILS ↗
              </button>
            </div>
          )}
        </div>

        {/* Dense Micro Matrix Grid */}
        <div className="mt-6">
          {filteredNfts.length === 0 ? (
            <div className="rounded-panel bg-paper p-12 text-center sticker">
              <p className="font-display text-[16px] text-ink">No Rare People found matching your search.</p>
              <button
                onClick={() => {
                  setSelectedRarity('All');
                  setSearchQuery('');
                }}
                className="mt-3 font-display text-[12px] text-blue-600 underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-1.5 sm:gap-2 ${
                density === 'ultra'
                  ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12'
                  : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
              }`}
            >
              {filteredNfts.map((nft, i) => (
                <MicroPixlCard
                  key={nft.id}
                  nft={nft}
                  index={i}
                  isSelected={inspectingNft?.id === nft.id}
                  onClick={() => setInspectingNft(nft)}
                  onHover={(item) => setHoveredNft(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Banner & Mint Call to Action */}
        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-panel bg-paper p-6 sticker sm:flex-row">
          <div>
            <h4 className="font-display text-[18px] text-ink">READY FOR THE 21 SEP DROP?</h4>
            <p className="font-sans text-[14px] text-ink-soft">
              All <span className="font-display text-ink font-bold">{SUPPLY.toLocaleString()}</span> Rare People mint on Robinhood. Whitelist guarantees priority access.
            </p>
          </div>
          <PixelButton variant="primary" size="md" onClick={openWhitelist}>
            JOIN WHITELIST TO MINT
          </PixelButton>
        </div>
      </div>

      {/* Interactive Micro Pixl Inspector Modal */}
      <AnimatePresence>
        {inspectingNft && (
          <PixlInspectorModal
            nft={inspectingNft}
            onClose={() => setInspectingNft(null)}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
