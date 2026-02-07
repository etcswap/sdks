export * from './constants'
export * from './errors'
export * from './entities'
export * from './router'

// Re-export commonly used types from sdk-core for convenience
export {
  ChainId,
  Currency,
  CurrencyAmount,
  NativeCurrency,
  Percent,
  Price,
  Token,
  TradeType,
  Fraction,
  ETC,
  WETC,
  validateAndParseAddress,
  sortedInsert,
} from '@etcswapv2/sdk-core'

// Backward compatibility exports for code expecting Uniswap SDK v2 API
import { ETC as _ETC, CurrencyAmount as _CurrencyAmount, Token as _Token, Currency as _Currency } from '@etcswapv2/sdk-core'
import _JSBI from 'jsbi'

// ETHER is now ETC on Ethereum Classic
export const ETHER = _ETC

// JSBI re-export for backward compatibility
export const JSBI = _JSBI

// TokenAmount is now CurrencyAmount<Token>
export type TokenAmount = _CurrencyAmount<_Token>

// currencyEquals helper function for backward compatibility
export function currencyEquals(currencyA: _Currency, currencyB: _Currency): boolean {
  if (currencyA instanceof _Token && currencyB instanceof _Token) {
    return currencyA.equals(currencyB)
  } else if (currencyA instanceof _Token || currencyB instanceof _Token) {
    return false
  } else {
    // Both are native currencies
    return currencyA.isNative && currencyB.isNative && currencyA.chainId === currencyB.chainId
  }
}
