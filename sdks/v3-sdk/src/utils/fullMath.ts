import JSBI from 'jsbi'
import { ONE, ZERO } from '../constants'

/**
 * Functions for full precision math operations
 */
export abstract class FullMath {
  /**
   * Cannot be constructed
   */
  private constructor() {}

  /**
   * Calculates floor(a×b÷denominator) with full precision
   * @param a The multiplicand
   * @param b The multiplier
   * @param denominator The divisor
   * @returns The result
   */
  public static mulDivRoundingUp(a: JSBI, b: JSBI, denominator: JSBI): JSBI {
    const product = JSBI.multiply(a, b)
    let result = JSBI.divide(product, denominator)
    if (JSBI.notEqual(JSBI.remainder(product, denominator), ZERO)) {
      result = JSBI.add(result, ONE)
    }
    return result
  }
}
