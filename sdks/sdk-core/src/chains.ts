/**
 * Chain IDs supported by ETCswap
 */
export enum ChainId {
  /** Ethereum Classic Mainnet */
  CLASSIC = 61,
  /** Mordor Testnet */
  MORDOR = 63,
}

export const SUPPORTED_CHAINS = [ChainId.CLASSIC, ChainId.MORDOR] as const

export type SupportedChainsType = (typeof SUPPORTED_CHAINS)[number]

export enum NativeCurrencyName {
  /** Ethereum Classic native currency */
  ETC = 'ETC',
  /** Mordor testnet native currency */
  METC = 'METC',
}

/**
 * Chain names for display
 */
export const CHAIN_NAMES: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: 'Ethereum Classic',
  [ChainId.MORDOR]: 'Mordor Testnet',
}
