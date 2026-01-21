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
 * This is the keccak256 of the ETCswap V2 pair contract bytecode
 * Note: Different on Classic vs Mordor due to separate deployments
 */
export const INIT_CODE_HASH = '0xb5e58237f3a44220ffc3dfb989e53735df8fcd9df82c94b13105be8380344e52'

/**
 * Init code hash map by chain ID
 * Classic and Mordor have different pair bytecodes
 */
export const INIT_CODE_HASH_MAP: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: '0xb5e58237f3a44220ffc3dfb989e53735df8fcd9df82c94b13105be8380344e52',
  [ChainId.MORDOR]: '0x4d8a51f257ed377a6ac3f829cd4226c892edbbbcb87622bcc232807b885b1303',
}

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
