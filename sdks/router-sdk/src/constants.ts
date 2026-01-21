import { ChainId } from '@etcswapv2/sdk-core'

// Universal Router address (same on both Classic and Mordor)
export const UNIVERSAL_ROUTER_ADDRESS = '0x9b676E761040D60C6939dcf5f582c2A4B51025F1'

export const UNIVERSAL_ROUTER_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: UNIVERSAL_ROUTER_ADDRESS,
  [ChainId.MORDOR]: UNIVERSAL_ROUTER_ADDRESS,
}

// SwapRouter02 address (combined V2 + V3 router, same on both Classic and Mordor)
export const SWAP_ROUTER_02_ADDRESS = '0xEd88EDD995b00956097bF90d39C9341BBde324d1'

export const SWAP_ROUTER_02_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: SWAP_ROUTER_02_ADDRESS,
  [ChainId.MORDOR]: SWAP_ROUTER_02_ADDRESS,
}

// Permit2 address (same on both Classic and Mordor)
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export const PERMIT2_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: PERMIT2_ADDRESS,
  [ChainId.MORDOR]: PERMIT2_ADDRESS,
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
