import { ChainId, NativeCurrencyName } from '../chains'
import type { Currency } from './currency'
import { NativeCurrency } from './nativeCurrency'
import { Token } from './token'
import { WETC } from './wetc'

/**
 * ETC (Ethereum Classic) is the native currency for the Ethereum Classic chain.
 */
export class ETC extends NativeCurrency {
  protected constructor(chainId: number) {
    const isClassic = chainId === ChainId.CLASSIC
    super(chainId, 18, isClassic ? NativeCurrencyName.ETC : NativeCurrencyName.METC, isClassic ? 'Ether' : 'Mordor Ether')
  }

  public get wrapped(): Token {
    const wetc = WETC[this.chainId as ChainId]
    if (!wetc) throw new Error('WETC not defined for chain')
    return wetc
  }

  private static _cache: { [chainId: number]: ETC } = {}

  public static onChain(chainId: number): ETC {
    if (!this._cache[chainId]) {
      this._cache[chainId] = new ETC(chainId)
    }
    return this._cache[chainId]
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}
