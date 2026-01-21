import { ChainId } from '@etcswapv2/sdk-core'

// Universal Router address
export const UNIVERSAL_ROUTER_ADDRESS = '0x5bC1F774BF69B3e68bfBb02e4Ce89De10dc6Df82'

export const UNIVERSAL_ROUTER_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: UNIVERSAL_ROUTER_ADDRESS,
  [ChainId.MORDOR]: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
}

// SwapRouter02 address (combined V2 + V3 router)
export const SWAP_ROUTER_02_ADDRESS = '0x4D09F7E7c00F39dA3eDA2df5e3f1e466a12E891e'

export const SWAP_ROUTER_02_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: SWAP_ROUTER_02_ADDRESS,
  [ChainId.MORDOR]: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
}

// Protocol identifiers
export enum Protocol {
  V2 = 'V2',
  V3 = 'V3',
  MIXED = 'MIXED',
}

// Trade types
export enum TradeType {
  EXACT_INPUT = 0,
  EXACT_OUTPUT = 1,
}
