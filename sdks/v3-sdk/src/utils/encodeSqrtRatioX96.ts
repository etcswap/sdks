import { sqrt } from '@etcswapv2/sdk-core'
import JSBI from 'jsbi'

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param amount1 The numerator amount i.e., the amount of token1
 * @param amount0 The denominator amount i.e., the amount of token0
 * @returns The sqrt ratio
 */
export function encodeSqrtRatioX96(amount1: JSBI, amount0: JSBI): JSBI {
  const numerator = JSBI.leftShift(amount1, JSBI.BigInt(192))
  const denominator = amount0
  const ratioX192 = JSBI.divide(numerator, denominator)
  return sqrt(ratioX192)
}
