// Feature Flags
export const IS_UNDER_MAINTENANCE = false;
export const IS_CHECKER_PAUSED = false;
export const SHOW_UNDER_REVIEW_ON_SUBMIT = false;
// Temporarily hide the navbar "[ wl checker ]" button. Set true to restore.
export const SHOW_WL_CHECKER_NAV = false;

// ==============================================================================
// OPENSEA SCHEDULED DROP CONFIGURATION (ROBINHOOD CHAIN)
// ==============================================================================
export interface OpenSeaDropConfig {
  IS_ENABLED: boolean;
  COLLECTION_SLUG: string;
  DROP_URL: string;
  NFT_CONTRACT_ADDRESS: string;
  SEADROP_CONTRACT_ADDRESS: string;
  FEE_RECIPIENT: string;
  NETWORK_NAME: string;
  CHAIN_ID: string;
  CHAIN_ID_DECIMAL: number;
  EXPLORER_URL: string;
  RPC_URL: string;
  SCHEDULED_START: string;
  IS_DROP_LIVE: boolean;
  MINT_PRICE_ETH: string;
}

export const DEFAULT_OPENSEA_DROP_CONFIG: OpenSeaDropConfig = {
  IS_ENABLED: true,
  COLLECTION_SLUG: 'test-collection',
  DROP_URL: 'https://opensea.io/assets/robinhood/0xc513D5Dcc07524a70B71D174Ee088E0f31039e9d',
  NFT_CONTRACT_ADDRESS: '0xc513D5Dcc07524a70B71D174Ee088E0f31039e9d',
  // Official OpenSea SeaDrop contract on Robinhood Chain (from on-chain contract events)
  SEADROP_CONTRACT_ADDRESS: '0x00005ea00ac477b1030ce78506496e8c2de24bf5',
  FEE_RECIPIENT: '0x0000a26b00c1F0DF003000390027140000fAa719',
  NETWORK_NAME: 'Robinhood Chain',
  CHAIN_ID: '0x1237', // 4663 in hexadecimal
  CHAIN_ID_DECIMAL: 4663,
  EXPLORER_URL: 'https://robinhoodchain.blockscout.com',
  RPC_URL: 'https://rpc.mainnet.chain.robinhood.com',
  SCHEDULED_START: '2026-09-20T17:00:00Z', // 22:30 IST
  IS_DROP_LIVE: false, // Calculated dynamically from stage schedule
  MINT_PRICE_ETH: '0', // Free test drop on Robinhood Chain
};

// ==============================================================================
// OPENSEA STUDIO CONFIGURED DROP STAGES (TEAM 22:30 IST, GTD 22:35 IST, FCFS 22:40 IST, PUBLIC 22:45 IST)
// Note: User configured OpenSea in IST (GMT+5:30)
// 22:30 IST = 17:00:00 UTC (unix: 1789923600)
// 22:35 IST = 17:05:00 UTC (unix: 1789923900)
// 22:40 IST = 17:10:00 UTC (unix: 1789924200)
// 22:45 IST = 17:15:00 UTC (unix: 1789924500 / on-chain: 1789924545)
// ==============================================================================
export interface OpenSeaStageConfigItem {
  id: 'TEAM' | 'GTD' | 'FCFS' | 'PUBLIC';
  name: string;
  stageNum: number;
  shortLabel: string;
  timeIST: string;
  timeDisplay: string;
  startSec: number;
  endSec: number;
  allocationDisplay: string;
  description: string;
}

export const OPENSEA_STAGES: OpenSeaStageConfigItem[] = [
  {
    id: 'TEAM',
    name: 'STAGE 1: TEAM',
    stageNum: 1,
    shortLabel: 'TEAM',
    timeIST: '22:30 IST',
    timeDisplay: '22:30 IST',
    startSec: 1789923600, // 2026-09-20T17:00:00Z = 22:30 IST
    endSec: 1789923900,   // 2026-09-20T17:05:00Z = 22:35 IST
    allocationDisplay: '2 SPOTS',
    description: 'Team & Core Contributors Allocation',
  },
  {
    id: 'GTD',
    name: 'STAGE 2: GTD (GUARANTEED)',
    stageNum: 2,
    shortLabel: 'GTD (GUARANTEED)',
    timeIST: '22:35 IST',
    timeDisplay: '22:35 IST',
    startSec: 1789923900, // 2026-09-20T17:05:00Z = 22:35 IST
    endSec: 1789924200,   // 2026-09-20T17:10:00Z = 22:40 IST
    allocationDisplay: '1 SPOT GUARANTEED',
    description: 'Guaranteed Allowlist Allocation',
  },
  {
    id: 'FCFS',
    name: 'STAGE 3: FCFS',
    stageNum: 3,
    shortLabel: 'FCFS',
    timeIST: '22:40 IST',
    timeDisplay: '22:40 IST',
    startSec: 1789924200, // 2026-09-20T17:10:00Z = 22:40 IST
    endSec: 1789924500,   // 2026-09-20T17:15:00Z = 22:45 IST
    allocationDisplay: '1 SPOT FCFS',
    description: 'First-Come First-Served Allowlist',
  },
  {
    id: 'PUBLIC',
    name: 'STAGE 4: PUBLIC',
    stageNum: 4,
    shortLabel: 'PUBLIC (OPENSEA)',
    timeIST: '22:45 IST',
    timeDisplay: '22:45 IST',
    startSec: 1789924500, // 2026-09-20T17:15:00Z = 22:45 IST (on-chain SeaDrop start: 1789924545)
    endSec: 1790524500,   // Ends in 7 days
    allocationDisplay: '2 PER WALLET',
    description: 'Public OpenSea Drop Open to Everyone',
  },
];

export function formatDurationSecs(diffSec: number): string {
  if (diffSec <= 0) return '00M 00S';
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  if (days > 0) {
    return `${days}D ${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`;
  }
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`;
  }
  return `${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`;
}

export function getOpenSeaStagesState(nowSec: number = Math.floor(Date.now() / 1000)) {
  const teamStage = OPENSEA_STAGES[0];
  const gtdStage = OPENSEA_STAGES[1];
  const fcfsStage = OPENSEA_STAGES[2];
  const publicStage = OPENSEA_STAGES[3];

  let currentActiveStage: OpenSeaStageConfigItem | null = null;
  let nextUpcomingStage: OpenSeaStageConfigItem | null = null;
  let targetNextTimeSec: number = teamStage.startSec;
  let timeRemainingText: string = '';

  if (nowSec < teamStage.startSec) {
    // Before drop starts
    currentActiveStage = null;
    nextUpcomingStage = teamStage;
    targetNextTimeSec = teamStage.startSec;
    timeRemainingText = formatDurationSecs(teamStage.startSec - nowSec);
  } else if (nowSec < gtdStage.startSec) {
    // Team stage is live
    currentActiveStage = teamStage;
    nextUpcomingStage = gtdStage;
    targetNextTimeSec = gtdStage.startSec;
    timeRemainingText = formatDurationSecs(gtdStage.startSec - nowSec);
  } else if (nowSec < fcfsStage.startSec) {
    // GTD stage is live
    currentActiveStage = gtdStage;
    nextUpcomingStage = fcfsStage;
    targetNextTimeSec = fcfsStage.startSec;
    timeRemainingText = formatDurationSecs(fcfsStage.startSec - nowSec);
  } else if (nowSec < publicStage.startSec) {
    // FCFS stage is live
    currentActiveStage = fcfsStage;
    nextUpcomingStage = publicStage;
    targetNextTimeSec = publicStage.startSec;
    timeRemainingText = formatDurationSecs(publicStage.startSec - nowSec);
  } else {
    // Public stage is live
    currentActiveStage = publicStage;
    nextUpcomingStage = null;
    targetNextTimeSec = 0;
    timeRemainingText = 'LIVE NOW';
  }

  return {
    currentActiveStage,
    nextUpcomingStage,
    targetNextTimeSec,
    timeRemainingText,
    isAnyStageLive: currentActiveStage !== null,
    isPublicLive: currentActiveStage?.id === 'PUBLIC',
    allStages: OPENSEA_STAGES,
  };
}

export function isDropTimeReached(scheduledStart: string): boolean {
  try {
    const target = new Date(scheduledStart).getTime();
    return !isNaN(target) && Date.now() >= target;
  } catch {
    return false;
  }
}

export function getActiveOpenSeaConfig(): OpenSeaDropConfig {
  if (typeof window === 'undefined') return DEFAULT_OPENSEA_DROP_CONFIG;
  try {
    const custom = localStorage.getItem('opensea_active_drop_config');
    let base = { ...DEFAULT_OPENSEA_DROP_CONFIG };
    if (custom) {
      const parsed = JSON.parse(custom);
      // Ensure the SeaDrop address is always the real Robinhood SeaDrop address
      if (!parsed.SEADROP_CONTRACT_ADDRESS || parsed.SEADROP_CONTRACT_ADDRESS.toLowerCase().endsWith('5ac1')) {
        parsed.SEADROP_CONTRACT_ADDRESS = DEFAULT_OPENSEA_DROP_CONFIG.SEADROP_CONTRACT_ADDRESS;
      }
      base = { ...base, ...parsed };
    }
    // Check if the scheduled start has passed dynamically
    base.IS_DROP_LIVE = isDropTimeReached(base.SCHEDULED_START);
    return base;
  } catch {
    return DEFAULT_OPENSEA_DROP_CONFIG;
  }
}

export function saveActiveOpenSeaConfig(config: Partial<OpenSeaDropConfig>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getActiveOpenSeaConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('opensea_active_drop_config', JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export const OPENSEA_DROP_CONFIG = DEFAULT_OPENSEA_DROP_CONFIG;

// General Minting Engine Configuration
export const MINT_CONFIG = {
  IS_LIVE: true,
  IS_GTD_ACTIVE: false,
  CURRENT_STAGE: 'PUBLIC',
  PHASE: 'PUBLIC STAGE (OPENSEA DROP)',
  TOTAL_SUPPLY: 10,
  INITIAL_MINTED: 0,
  MAX_PER_WALLET: 2,
  
  STAGE_PRICES: {
    TEAM: { usd: 0, usdLabel: 'FREE', ethPerItem: '0', weiPerItem: '0x0' },
    GUARANTEED: { usd: 0, usdLabel: 'FREE', ethPerItem: '0', weiPerItem: '0x0' },
    FCFS_WL: { usd: 0, usdLabel: 'FREE', ethPerItem: '0', weiPerItem: '0x0' },
    PUBLIC: { usd: 0, usdLabel: 'FREE', ethPerItem: '0', weiPerItem: '0x0' },
  },
};
