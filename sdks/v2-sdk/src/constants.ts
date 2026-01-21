import { Percent, V2_FACTORY_ADDRESS, ChainId } from '@etcswapv2/sdk-core'
import JSBI from 'jsbi'

/**
 * Factory address for ETCswap V2
 */
export const FACTORY_ADDRESS = V2_FACTORY_ADDRESS[ChainId.CLASSIC]

/**
 * Factory address map by chain ID
 */
export const FACTORY_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: V2_FACTORY_ADDRESS[ChainId.CLASSIC],
  [ChainId.MORDOR]: V2_FACTORY_ADDRESS[ChainId.MORDOR],
}

/**
 * Init code hash for computing pair addresses
 * This is the keccak256 of the pair contract bytecode
 */
export const INIT_CODE_HASH = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const FIVE = JSBI.BigInt(5)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)
export const BASIS_POINTS = JSBI.BigInt(10000)

export const ZERO_PERCENT = new Percent(ZERO)
export const ONE_HUNDRED_PERCENT = new Percent(ONE)
