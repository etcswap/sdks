import type { NativeCurrency } from './nativeCurrency'
import type { Token } from './token'

/**
 * A currency is any fungible financial instrument, including ETC, all ERC20 tokens,
 * and other chain-native currencies
 */
export type Currency = NativeCurrency | Token
