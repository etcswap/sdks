import { BigintIsh, CurrencyAmount, Token } from '@etcswapv2/sdk-core'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

import { MAX_TICK, MIN_TICK, ZERO } from '../constants'
import { maxLiquidityForAmounts } from '../utils/maxLiquidityForAmounts'
import { SqrtPriceMath } from '../utils/sqrtPriceMath'
import { TickMath } from '../utils/tickMath'
import { Pool } from './pool'

interface PositionConstructorArgs {
  pool: Pool
  liquidity: BigintIsh
  tickLower: number
  tickUpper: number
}

/**
 * Represents a position on a V3 pool
 */
export class Position {
  public readonly pool: Pool
  public readonly tickLower: number
  public readonly tickUpper: number
  public readonly liquidity: JSBI

  // cached resuts for the getters
  private _token0Amount: CurrencyAmount<Token> | null = null
  private _token1Amount: CurrencyAmount<Token> | null = null
  private _mintAmounts: Readonly<{ amount0: JSBI; amount1: JSBI }> | null = null

  /**
   * Constructs a position for a given pool with the given liquidity
   * @param pool The pool for which the position is constructed
   * @param liquidity The liquidity that is in the position
   * @param tickLower The lower tick of the position
   * @param tickUpper The upper tick of the position
   */
  public constructor({ pool, liquidity, tickLower, tickUpper }: PositionConstructorArgs) {
    invariant(tickLower < tickUpper, 'TICK_ORDER')
    invariant(tickLower >= MIN_TICK && tickLower % pool.tickSpacing === 0, 'TICK_LOWER')
    invariant(tickUpper <= MAX_TICK && tickUpper % pool.tickSpacing === 0, 'TICK_UPPER')

    this.pool = pool
    this.tickLower = tickLower
    this.tickUpper = tickUpper
    this.liquidity = JSBI.BigInt(liquidity)
  }

  /**
   * Returns the price of token0 at the lower tick
   */
  public get token0PriceLower(): any {
    return TickMath.getSqrtRatioAtTick(this.tickLower)
  }

  /**
   * Returns the price of token0 at the upper tick
   */
  public get token0PriceUpper(): any {
    return TickMath.getSqrtRatioAtTick(this.tickUpper)
  }

  /**
   * Returns the amount of token0 that this position's liquidity could be burned for at the current pool price
   */
  public get amount0(): CurrencyAmount<Token> {
    if (this._token0Amount === null) {
      if (this.pool.tickCurrent < this.tickLower) {
        this._token0Amount = CurrencyAmount.fromRawAmount(
          this.pool.token0,
          SqrtPriceMath.getAmount0Delta(
            TickMath.getSqrtRatioAtTick(this.tickLower),
            TickMath.getSqrtRatioAtTick(this.tickUpper),
            this.liquidity,
            false
          )
        )
      } else if (this.pool.tickCurrent < this.tickUpper) {
        this._token0Amount = CurrencyAmount.fromRawAmount(
          this.pool.token0,
          SqrtPriceMath.getAmount0Delta(
            this.pool.sqrtRatioX96,
            TickMath.getSqrtRatioAtTick(this.tickUpper),
            this.liquidity,
            false
          )
        )
      } else {
        this._token0Amount = CurrencyAmount.fromRawAmount(this.pool.token0, ZERO)
      }
    }
    return this._token0Amount
  }

  /**
   * Returns the amount of token1 that this position's liquidity could be burned for at the current pool price
   */
  public get amount1(): CurrencyAmount<Token> {
    if (this._token1Amount === null) {
      if (this.pool.tickCurrent < this.tickLower) {
        this._token1Amount = CurrencyAmount.fromRawAmount(this.pool.token1, ZERO)
      } else if (this.pool.tickCurrent < this.tickUpper) {
        this._token1Amount = CurrencyAmount.fromRawAmount(
          this.pool.token1,
          SqrtPriceMath.getAmount1Delta(
            TickMath.getSqrtRatioAtTick(this.tickLower),
            this.pool.sqrtRatioX96,
            this.liquidity,
            false
          )
        )
      } else {
        this._token1Amount = CurrencyAmount.fromRawAmount(
          this.pool.token1,
          SqrtPriceMath.getAmount1Delta(
            TickMath.getSqrtRatioAtTick(this.tickLower),
            TickMath.getSqrtRatioAtTick(this.tickUpper),
            this.liquidity,
            false
          )
        )
      }
    }
    return this._token1Amount
  }

  /**
   * Returns the minimum amounts that must be sent in order to mint the amount of liquidity held by the position at
   * the current price for the pool
   */
  public get mintAmounts(): Readonly<{ amount0: JSBI; amount1: JSBI }> {
    if (this._mintAmounts === null) {
      if (this.pool.tickCurrent < this.tickLower) {
        return {
          amount0: SqrtPriceMath.getAmount0Delta(
            TickMath.getSqrtRatioAtTick(this.tickLower),
            TickMath.getSqrtRatioAtTick(this.tickUpper),
            this.liquidity,
            true
          ),
          amount1: ZERO,
        }
      } else if (this.pool.tickCurrent < this.tickUpper) {
        return {
          amount0: SqrtPriceMath.getAmount0Delta(
            this.pool.sqrtRatioX96,
            TickMath.getSqrtRatioAtTick(this.tickUpper),
            this.liquidity,
            true
          ),
          amount1: SqrtPriceMath.getAmount1Delta(
            TickMath.getSqrtRatioAtTick(this.tickLower),
            this.pool.sqrtRatioX96,
            this.liquidity,
            true
          ),
        }
      } else {
        return {
          amount0: ZERO,
          amount1: SqrtPriceMath.getAmount1Delta(
            TickMath.getSqrtRatioAtTick(this.tickLower),
            TickMath.getSqrtRatioAtTick(this.tickUpper),
            this.liquidity,
            true
          ),
        }
      }
    }
    return this._mintAmounts
  }

  /**
   * Computes the maximum amount of liquidity received for a given amount of token0, token1, and the prices at the tick boundaries
   * @param pool The pool for which the position should be created
   * @param tickLower The lower tick of the position
   * @param tickUpper The upper tick of the position
   * @param amount0 token0 amount
   * @param amount1 token1 amount
   * @param useFullPrecision If false, liquidity will be maximized according to what the router can calculate, not what core can theoretically support
   * @returns The amount of liquidity for the position
   */
  public static fromAmounts({
    pool,
    tickLower,
    tickUpper,
    amount0,
    amount1,
    useFullPrecision,
  }: {
    pool: Pool
    tickLower: number
    tickUpper: number
    amount0: BigintIsh
    amount1: BigintIsh
    useFullPrecision: boolean
  }): Position {
    const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
    const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)
    return new Position({
      pool,
      tickLower,
      tickUpper,
      liquidity: maxLiquidityForAmounts(
        pool.sqrtRatioX96,
        sqrtRatioAX96,
        sqrtRatioBX96,
        JSBI.BigInt(amount0),
        JSBI.BigInt(amount1),
        useFullPrecision
      ),
    })
  }

  /**
   * Computes a position with the maximum amount of liquidity received for a given amount of token0, assuming an unlimited amount of token1
   * @param pool The pool for which the position is created
   * @param tickLower The lower tick
   * @param tickUpper The upper tick
   * @param amount0 The desired amount of token0
   * @param useFullPrecision If true, liquidity will be maximized according to what the router can calculate, not what core can theoretically support
   * @returns The position
   */
  public static fromAmount0({
    pool,
    tickLower,
    tickUpper,
    amount0,
    useFullPrecision,
  }: {
    pool: Pool
    tickLower: number
    tickUpper: number
    amount0: BigintIsh
    useFullPrecision: boolean
  }): Position {
    return Position.fromAmounts({ pool, tickLower, tickUpper, amount0, amount1: JSBI.BigInt(-1), useFullPrecision })
  }

  /**
   * Computes a position with the maximum amount of liquidity received for a given amount of token1, assuming an unlimited amount of token0
   * @param pool The pool for which the position is created
   * @param tickLower The lower tick
   * @param tickUpper The upper tick
   * @param amount1 The desired amount of token1
   * @returns The position
   */
  public static fromAmount1({
    pool,
    tickLower,
    tickUpper,
    amount1,
  }: {
    pool: Pool
    tickLower: number
    tickUpper: number
    amount1: BigintIsh
  }): Position {
    return Position.fromAmounts({ pool, tickLower, tickUpper, amount0: JSBI.BigInt(-1), amount1, useFullPrecision: true })
  }
}
