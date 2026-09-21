import raw from '../../nfts.json';
import microRaw from './microNfts.json';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface Nft {
  id: string;
  name: string;
  short: string; // display name without the "Rare Person #id —" prefix
  image: string; // absolute, served from /public
  rarity: Rarity;
  traits: Record<string, string>;
  background: string;
}

// chip styling per rarity — controlled accent use
export const RARITY: Record<Rarity, { bg: string; fg: string }> = {
  Common: { bg: 'var(--color-sand)', fg: 'var(--color-ink)' },
  Rare: { bg: 'var(--color-blue)', fg: 'var(--color-paper)' },
  Epic: { bg: 'var(--color-amber)', fg: 'var(--color-ink)' },
  Legendary: { bg: 'var(--color-lime)', fg: 'var(--color-ink)' },
  Mythic: { bg: 'var(--color-coral)', fg: 'var(--color-paper)' },
};

export const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

const normalize = (r: (typeof raw)[number]): Nft => {
  const cleanName = (r.name || `Rare Person #${r.id}`).replace(/ArcPixl/g, 'Rare Person');
  return {
    id: r.id,
    name: cleanName,
    short: cleanName.split('—')[1]?.trim() ?? cleanName,
    image: '/' + r.image.replace(/^\//, ''),
    rarity: r.rarity as Rarity,
    traits: r.traits,
    background: r.background,
  };
};

export const nfts: Nft[] = raw.map(normalize);

export const allMicroNfts: Nft[] = (microRaw as any[]).map((r) => {
  const cleanName = (r.name || `Rare Person #${r.id}`).replace(/ArcPixl/g, 'Rare Person');
  return {
    ...r,
    name: cleanName,
    short: cleanName.split('—')[1]?.trim() ?? cleanName,
    image: '/' + (r.image || '').replace(/^\//, ''),
  } as Nft;
});
export const microNfts: Nft[] = allMicroNfts;

// A curated, rarity-varied set for the collection grid / about page.
const pick = ['0003', '0007', '0001', '0004', '0005', '0002', '0014', '0006'];
export const featured: Nft[] = pick
  .map((id) => nfts.find((n) => n.id === id))
  .filter((n): n is Nft => Boolean(n));

