import { Currency, Price, Token } from '@etcswapv2/sdk-core'
import { Pair } from '@etcswapv2/sdk'
import { Pool } from '@etcswapv3/sdk'
import invariant from 'tiny-invariant'

/**
 * Type guard for V2 Pair
 */
export function isV2Pair(pool: Pair | Pool): pool is Pair {
  return pool instanceof Pair
}

/**
 * Type guard for V3 Pool
 */
export function isV3Pool(pool: Pair | Pool): pool is Pool {
  return pool instanceof Pool
}

/**
 * Represents a route through some pools where the swap can traverse both V2 and V3 pools
 */
export class MixedRouteSDK<TInput extends Currency, TOutput extends Currency> {
  public readonly pools: (Pair | Pool)[]
  public readonly path: Token[]
  public readonly input: TInput
  public readonly output: TOutput

  private _midPrice: Price<TInput, TOutput> | null = null

  /**
   * Creates an instance of route
   * @param pools An array of `Pool` or `Pair` objects, ordered by the route the swap will take
   * @param input The input token
   * @param output The output token
   */
  public constructor(pools: (Pair | Pool)[], input: TInput, output: TOutput) {
    invariant(pools.length > 0, 'POOLS')

    const chainId = isV2Pair(pools[0]) ? pools[0].chainId : pools[0].chainId
    const allOnSameChain = pools.every((pool) =>
      isV2Pair(pool) ? pool.chainId === chainId : pool.chainId === chainId
    )
    invariant(allOnSameChain, 'CHAIN_IDS')

    const wrappedInput = input.wrapped
    invariant(this.poolInvolvesToken(pools[0], wrappedInput), 'INPUT')

    invariant(this.poolInvolvesToken(pools[pools.length - 1], output.wrapped), 'OUTPUT')

    // Normalizes token0-token1 ordering and selects the next token/fee step to add to the path
    const path: Token[] = [wrappedInput]
    for (const [i, pool] of pools.entries()) {
      const currentInputToken = path[i]
      invariant(
        currentInputToken.equals(this.getToken0(pool)) || currentInputToken.equals(this.getToken1(pool)),
        'PATH'
      )
      const nextToken = currentInputToken.equals(this.getToken0(pool))
        ? this.getToken1(pool)
        : this.getToken0(pool)
      path.push(nextToken)
    }

    this.pools = pools
    this.path = path
    this.input = input
    this.output = output
  }

  /**
   * Returns the chain ID of the route
   */
  public get chainId(): number {
    return isV2Pair(this.pools[0]) ? this.pools[0].chainId : this.pools[0].chainId
  }

  /**
   * Returns the mid price of the route
   */
  public get midPrice(): Price<TInput, TOutput> {
    if (this._midPrice !== null) return this._midPrice

    const price = this.pools.slice(1).reduce(
      ({ nextInput, price }, pool) => {
        const token0 = this.getToken0(pool)
        return nextInput.equals(token0)
          ? {
              nextInput: this.getToken1(pool),
              price: price.multiply(this.getToken0Price(pool)),
            }
          : {
              nextInput: token0,
              price: price.multiply(this.getToken1Price(pool)),
            }
      },
      this.path[0].equals(this.getToken0(this.pools[0]))
        ? {
            nextInput: this.getToken1(this.pools[0]),
            price: this.getToken0Price(this.pools[0]),
          }
        : {
            nextInput: this.getToken0(this.pools[0]),
            price: this.getToken1Price(this.pools[0]),
          }
    ).price

    return (this._midPrice = new Price(this.input, this.output, price.denominator, price.numerator))
  }

  /**
   * Helper to check if a pool involves a token
   */
  private poolInvolvesToken(pool: Pair | Pool, token: Token): boolean {
    if (isV2Pair(pool)) {
      return pool.involvesToken(token)
    }
    return pool.involvesToken(token)
  }

  /**
   * Helper to get token0 from a pool
   */
  private getToken0(pool: Pair | Pool): Token {
    if (isV2Pair(pool)) {
      return pool.token0
    }
    return pool.token0
  }

  /**
   * Helper to get token1 from a pool
   */
  private getToken1(pool: Pair | Pool): Token {
    if (isV2Pair(pool)) {
      return pool.token1
    }
    return pool.token1
  }

  /**
   * Helper to get token0 price from a pool
   */
  private getToken0Price(pool: Pair | Pool): Price<Token, Token> {
    if (isV2Pair(pool)) {
      return pool.token0Price
    }
    return pool.token0Price
  }

  /**
   * Helper to get token1 price from a pool
   */
  private getToken1Price(pool: Pair | Pool): Price<Token, Token> {
    if (isV2Pair(pool)) {
      return pool.token1Price
    }
    return pool.token1Price
  }
}
