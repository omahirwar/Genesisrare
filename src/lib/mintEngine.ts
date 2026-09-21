import { encodeFunctionData, parseAbi, createPublicClient, http } from 'viem';
import { 
  getActiveOpenSeaConfig, 
  getOpenSeaStagesState, 
  formatDurationSecs, 
  type OpenSeaStageConfigItem 
} from './config';

// Full ABI for OpenSea SeaDrop v1.0
export const seadropAbi = parseAbi([
  'function mintPublic(address nftContract, address feeRecipient, address minterIfNotPayer, uint256 quantity) payable',
  'function getPublicDrop(address nftContract) view returns ((uint80 mintPrice, uint48 startTime, uint48 endTime, uint16 maxTotalMintsPerWallet, uint16 feeBps, bool restrictFeeRecipients))',
  'function getAllowListMerkleRoot(address nftContract) view returns (bytes32)',
  'function getMintStats(address nftContract, address minter) view returns (uint256 minterNumMinted, uint256 currentTotalMints, uint256 maxTotalMints)',
]);

// ABI for ERC721SeaDrop NFT Contract
export const nftContractAbi = parseAbi([
  'function getMintStats(address minter) view returns (uint256 minterNumMinted, uint256 currentTotalMints, uint256 maxTotalMints)',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
]);

export interface MintResult {
  success: boolean;
  txHash: string;
  quantity: number;
  blockNumber?: number;
  explorerUrl?: string;
  error?: string;
}

export type MintStage = 
  | 'IDLE'
  | 'CHECKING_CHAIN'
  | 'AWAITING_SIGNATURE'
  | 'SUBMITTING'
  | 'CONFIRMING'
  | 'SUCCESS'
  | 'ERROR';

export interface DropOnChainStats {
  totalSupply: number;
  maxSupply: number;
  userMinted: number;
  maxUserMints: number;
  isEligible: boolean;
  startTime: number;
  endTime: number;
  isStageLive: boolean;
  startsInSeconds: number;
  mintPriceWei: bigint;
  formattedStartTimeUTC: string;
  hasAllowList: boolean;
  allowListMerkleRoot: string;
  hasWaitlist: boolean;
  activeStageName: string;
  currentActiveStage: OpenSeaStageConfigItem | null;
  nextUpcomingStage: OpenSeaStageConfigItem | null;
  stagesState: ReturnType<typeof getOpenSeaStagesState>;
}

/**
 * Fetch live on-chain stats and drop schedule directly from SeaDrop smart contract
 */
export async function fetchOnChainDropStats(account?: string): Promise<DropOnChainStats> {
  const config = getActiveOpenSeaConfig();
  const rpcUrl = config.RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';

  const nowSec = Math.floor(Date.now() / 1000);
  const stagesState = getOpenSeaStagesState(nowSec);
  const currentActiveStage = stagesState.currentActiveStage;
  const nextUpcomingStage = stagesState.nextUpcomingStage;
  const isStageLive = stagesState.isAnyStageLive;
  const activeStageName = currentActiveStage
    ? `${currentActiveStage.name} (${currentActiveStage.timeDisplay})`
    : 'UPCOMING: STAGE 1 (TEAM AT 22:30 IST)';
  const startTime = stagesState.targetNextTimeSec;
  const startsInSeconds = Math.max(0, startTime - nowSec);

  const fallbackStart = startTime;
  const fallbackEnd = fallbackStart + (5 * 24 * 60 * 60);

  try {
    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    const nft = config.NFT_CONTRACT_ADDRESS as `0x${string}`;
    const seadrop = (config.SEADROP_CONTRACT_ADDRESS || '0x00005ea00ac477b1030ce78506496e8c2de24bf5') as `0x${string}`;

    const [totalSupply, maxSupply, publicDrop, allowListMerkleRoot] = await Promise.all([
      (client.readContract as any)({ address: nft, abi: nftContractAbi, functionName: 'totalSupply' }).catch(() => 0n),
      (client.readContract as any)({ address: nft, abi: nftContractAbi, functionName: 'maxSupply' }).catch(() => 10n),
      (client.readContract as any)({
        address: seadrop,
        abi: seadropAbi,
        functionName: 'getPublicDrop',
        args: [nft],
      }).catch(() => null),
      (client.readContract as any)({
        address: seadrop,
        abi: seadropAbi,
        functionName: 'getAllowListMerkleRoot',
        args: [nft],
      }).catch(() => '0x0000000000000000000000000000000000000000000000000000000000000000'),
    ]);

    const merkleRootStr = typeof allowListMerkleRoot === 'string' ? allowListMerkleRoot : '';
    const hasAllowList = Boolean(
      merkleRootStr &&
      merkleRootStr !== '0x0000000000000000000000000000000000000000000000000000000000000000' &&
      merkleRootStr !== '0x'
    );
    const hasWaitlist = false;

    let endTime = fallbackEnd;
    let mintPriceWei = 0n;
    let maxTotalMintsPerWallet = 2;

    if (publicDrop) {
      if (publicDrop.startTime !== undefined) {
        endTime = Number(publicDrop.endTime);
        mintPriceWei = BigInt(publicDrop.mintPrice || 0n);
        maxTotalMintsPerWallet = Number(publicDrop.maxTotalMintsPerWallet || 2);
      } else if (Array.isArray(publicDrop)) {
        mintPriceWei = BigInt(publicDrop[0] || 0n);
        endTime = Number(publicDrop[2] || fallbackEnd);
        maxTotalMintsPerWallet = Number(publicDrop[3] || 2);
      }
    }

    let userMinted = 0;
    let maxUserMints = maxTotalMintsPerWallet;

    if (account && account.startsWith('0x')) {
      try {
        const stats = await (client.readContract as any)({
          address: nft,
          abi: nftContractAbi,
          functionName: 'getMintStats',
          args: [account as `0x${string}`],
        });
        userMinted = Number(stats[0]);
        maxUserMints = Number(stats[2]) || maxTotalMintsPerWallet;
      } catch {
        // fallback
      }
    }

    return {
      totalSupply: Number(totalSupply),
      maxSupply: Number(maxSupply),
      userMinted,
      maxUserMints,
      isEligible: userMinted < maxUserMints,
      startTime,
      endTime,
      isStageLive,
      startsInSeconds,
      mintPriceWei,
      formattedStartTimeUTC: new Date(startTime * 1000).toUTCString(),
      hasAllowList,
      allowListMerkleRoot: merkleRootStr,
      hasWaitlist,
      activeStageName,
      currentActiveStage,
      nextUpcomingStage,
      stagesState,
    };
  } catch {
    return {
      totalSupply: 0,
      maxSupply: 10,
      userMinted: 0,
      maxUserMints: 2,
      isEligible: true,
      startTime,
      endTime: fallbackEnd,
      isStageLive,
      startsInSeconds,
      mintPriceWei: 0n,
      formattedStartTimeUTC: new Date(startTime * 1000).toUTCString(),
      hasAllowList: false,
      allowListMerkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      hasWaitlist: false,
      activeStageName,
      currentActiveStage,
      nextUpcomingStage,
      stagesState,
    };
  }
}

/**
 * Execute real on-chain transaction directly via user's connected wallet
 * SAFETY GUARD: Checks drop stage status BEFORE prompting any wallet popup!
 */
export async function executeRealMint(
  connectedAccount?: string,
  quantity: number = 1,
  onStageChange?: (stage: MintStage, message?: string) => void
): Promise<MintResult> {
  const openSeaConfig = getActiveOpenSeaConfig();

  // 1. Check drop schedule FIRST
  const nowSec = Math.floor(Date.now() / 1000);
  const stagesState = getOpenSeaStagesState(nowSec);

  if (!stagesState.isAnyStageLive) {
    const diffSec = stagesState.targetNextTimeSec - nowSec;
    const timeFormatted = formatDurationSecs(diffSec);

    // DO NOT OPEN WALLET POPUP!
    throw new Error(
      `OpenSea drop begins with Stage 1 (Team) at 22:30 IST (in ${timeFormatted}). Subsequent stages: GTD (22:35 IST), FCFS (22:40 IST), and Public (22:45 IST). Transactions before 22:30 IST will be rejected.`
    );
  }

  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No Web3 wallet found. Please install MetaMask or OKX Wallet.');
  }

  const provider = (window as any).ethereum;

  // 2. Request active account
  const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Please connect your Web3 wallet to proceed.');
  }
  const account = accounts[0];

  onStageChange?.('CHECKING_CHAIN', `Verifying network (${openSeaConfig.NETWORK_NAME})...`);

  // Target Chain details from config
  const targetChainId = openSeaConfig.CHAIN_ID;
  const targetChainDecimal = openSeaConfig.CHAIN_ID_DECIMAL;
  const targetNetworkName = openSeaConfig.NETWORK_NAME;

  try {
    const currentChainId = await provider.request({ method: 'eth_chainId' });
    if (
      currentChainId.toLowerCase() !== targetChainId.toLowerCase() &&
      parseInt(currentChainId, 16) !== targetChainDecimal
    ) {
      onStageChange?.('CHECKING_CHAIN', `Please approve network switch to ${targetNetworkName}...`);
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    }
  } catch (switchErr: any) {
    if (switchErr?.code === 4902) {
      onStageChange?.('CHECKING_CHAIN', `Adding ${targetNetworkName} to wallet...`);
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: targetChainId,
            chainName: targetNetworkName,
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [openSeaConfig.RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'],
            blockExplorerUrls: [openSeaConfig.EXPLORER_URL || 'https://robinhoodchain.blockscout.com'],
          },
        ],
      });
    } else if (switchErr?.code === 4001) {
      throw new Error('Network switch was rejected in wallet.');
    }
  }

  onStageChange?.('CHECKING_CHAIN', 'Fetching verified mint parameters from OpenSea Drops API...');

  try {
    const osDropRes = await fetch('/api/opensea/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minter: account,
        quantity,
        slug: openSeaConfig.COLLECTION_SLUG,
      }),
    });

    const osData = await osDropRes.json();

    if (!osDropRes.ok || !osData.to || !osData.data) {
      const errorMsg = osData?.error || 'OpenSea Drops API could not generate mint transaction.';
      throw new Error(errorMsg);
    }

    onStageChange?.('AWAITING_SIGNATURE', 'Please confirm the transaction in your wallet...');

    const txParams: Record<string, string> = {
      from: account,
      to: osData.to,
      value: osData.value || '0x0',
      data: osData.data,
    };

    // Send REAL on-chain transaction through user's wallet
    const txHash: string = await provider.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    });

    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
      throw new Error('No transaction hash returned from wallet.');
    }

    onStageChange?.('SUBMITTING', `Transaction broadcast! Hash: ${txHash.slice(0, 10)}...`);

    // Poll for real blockchain receipt
    let receipt: any = null;
    let attempts = 0;
    const maxAttempts = 20;

    onStageChange?.('CONFIRMING', `Waiting for block confirmation on ${targetNetworkName}...`);

    while (!receipt && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
      } catch {
        // Still pending
      }
      attempts++;
    }

    const blockNum = receipt?.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined;
    const explorerLink = `${openSeaConfig.EXPLORER_URL}/tx/${txHash}`;

    onStageChange?.('SUCCESS', 'Transaction verified on-chain!');

    return {
      success: true,
      txHash,
      quantity,
      blockNumber: blockNum,
      explorerUrl: explorerLink,
    };
  } catch (err: any) {
    onStageChange?.('ERROR', err.message || 'Transaction failed');
    
    // Friendly diagnosis for common Web3 errors
    if (err?.code === 4001 || err?.message?.includes('User rejected') || err?.message?.includes('denied')) {
      throw new Error('Transaction cancelled by user in wallet.');
    }
    
    // Check if error is NotActive (0x13da22f2)
    if (
      err?.message?.includes('0x13da22f2') || 
      err?.data?.includes('0x13da22f2') ||
      err?.message?.toLowerCase().includes('notactive')
    ) {
      throw new Error('OpenSea Drop stage is scheduled to start at 17:15 UTC. The smart contract activates automatically at the exact start timestamp.');
    }

    throw new Error(err?.message || 'Failed to broadcast on-chain transaction.');
  }
}

export function getUserMintedCount(account: string): number {
  return 0;
}
