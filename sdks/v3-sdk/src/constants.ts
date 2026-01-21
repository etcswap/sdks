import JSBI from 'jsbi'
import { ChainId } from '@etcswapv2/sdk-core'

// V3 Factory and Pool addresses
export const FACTORY_ADDRESS = '0xC1b9eA1E0c30D37E0f0ACd3edb5f74D78295Bf79'

export const FACTORY_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: FACTORY_ADDRESS,
  [ChainId.MORDOR]: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
}

// Pool deployer for CREATE2 address derivation
export const POOL_DEPLOYER_ADDRESS = '0xC1b9eA1E0c30D37E0f0ACd3edb5f74D78295Bf79'

// V3 NFT Position Manager
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0x9dB25dF3E81D2c6bC41C858B39C2F77AB0F09Fa6'

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.MORDOR]: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
}

// V3 SwapRouter
export const SWAP_ROUTER_ADDRESS = '0x4D09F7E7c00F39dA3eDA2df5e3f1e466a12E891e'

export const SWAP_ROUTER_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: SWAP_ROUTER_ADDRESS,
  [ChainId.MORDOR]: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
}

// Pool init code hash for CREATE2 address computation
export const POOL_INIT_CODE_HASH = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'

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
