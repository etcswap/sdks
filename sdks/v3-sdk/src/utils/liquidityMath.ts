import JSBI from 'jsbi'
import { ZERO } from '../constants'

/**
 * Provides functions for computing liquidity amounts
 */
export abstract class LiquidityMath {
  /**
   * Cannot be constructed
   */
  private constructor() {}

  /**
   * Adds a signed liquidity delta to liquidity
   * @param x The starting liquidity
   * @param y The delta to add
   * @returns The result
   */
  public static addDelta(x: JSBI, y: JSBI): JSBI {
    if (JSBI.lessThan(y, ZERO)) {
      return JSBI.subtract(x, JSBI.multiply(y, JSBI.BigInt(-1)))
    } else {
      return JSBI.add(x, y)
    }
  }
}
