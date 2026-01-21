import JSBI from 'jsbi'
import { ChainId } from '@etcswapv2/sdk-core'

// V3 Factory address (same on both Classic and Mordor)
export const FACTORY_ADDRESS = '0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC'

export const FACTORY_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: FACTORY_ADDRESS,
  [ChainId.MORDOR]: FACTORY_ADDRESS,
}

// Pool deployer for CREATE2 address derivation (same as factory)
export const POOL_DEPLOYER_ADDRESS = '0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC'

// V3 NFT Position Manager (same on both Classic and Mordor)
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0x3CEDe6562D6626A04d7502CC35720901999AB699'

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.MORDOR]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
}

// V3 SwapRouter02 (same on both Classic and Mordor)
export const SWAP_ROUTER_ADDRESS = '0xEd88EDD995b00956097bF90d39C9341BBde324d1'

export const SWAP_ROUTER_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: SWAP_ROUTER_ADDRESS,
  [ChainId.MORDOR]: SWAP_ROUTER_ADDRESS,
}

// V3 Quoter V2 (same on both Classic and Mordor)
export const QUOTER_ADDRESS = '0x4d8c163400CB87Cbe1bae76dBf36A09FED85d39B'

export const QUOTER_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: QUOTER_ADDRESS,
  [ChainId.MORDOR]: QUOTER_ADDRESS,
}

// Pool init code hash for CREATE2 address computation
export const POOL_INIT_CODE_HASH = '0x7ea2da342810af3c5a9b47258f990aaac829fe1385a1398feb77d0126a85dbef'

// Fee amounts
export enum FeeAmount {
  LOWEST = 100,
  LOW = 500,
  MEDIUM = 3000,
  HIGH = 10000,
}

// Tick spacings for each fee tier
export const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
  [FeeAmount.LOWEST]: 1,
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 60,
  [FeeAmount.HIGH]: 200,
}

// Math constants
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
export const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2))

// Tick boundaries
export const MIN_TICK = -887272
export const MAX_TICK = -MIN_TICK

// Sqrt price boundaries (sqrt(1.0001^tick) * 2^96)
export const MIN_SQRT_RATIO = JSBI.BigInt('4295128739')
export const MAX_SQRT_RATIO = JSBI.BigInt('1461446703485210103287273052203988822378723970342')

// Liquidity boundaries
export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// Used for computing liquidity amounts
export const NEGATIVE_ONE = JSBI.BigInt(-1)
