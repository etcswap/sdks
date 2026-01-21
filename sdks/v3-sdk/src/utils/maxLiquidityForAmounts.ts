import JSBI from 'jsbi'
import { Q96 } from '../constants'

/**
 * Returns the maximum amount of liquidity received for a given amount of token0, token1, and the prices at the tick boundaries.
 * @param sqrtRatioCurrentX96 The current sqrt price
 * @param sqrtRatioAX96 The sqrt price at the lower tick boundary
 * @param sqrtRatioBX96 The sqrt price at the upper tick boundary
 * @param amount0 The amount of token0 being sent in
 * @param amount1 The amount of token1 being sent in
 * @param useFullPrecision If true, liquidity will be maximized according to the current tick
 * @returns The maximum amount of liquidity received
 */
export function maxLiquidityForAmounts(
  sqrtRatioCurrentX96: JSBI,
  sqrtRatioAX96: JSBI,
  sqrtRatioBX96: JSBI,
  amount0: JSBI,
  amount1: JSBI,
  useFullPrecision: boolean
): JSBI {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }

  const getLiquidityForAmount0 = useFullPrecision ? getLiquidityForAmount0Precise : getLiquidityForAmount0Imprecise
  const getLiquidityForAmount1 = getLiquidityForAmount1Precise

  if (JSBI.lessThanOrEqual(sqrtRatioCurrentX96, sqrtRatioAX96)) {
    return getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0)
  } else if (JSBI.lessThan(sqrtRatioCurrentX96, sqrtRatioBX96)) {
    const liquidity0 = getLiquidityForAmount0(sqrtRatioCurrentX96, sqrtRatioBX96, amount0)
    const liquidity1 = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioCurrentX96, amount1)
    return JSBI.lessThan(liquidity0, liquidity1) ? liquidity0 : liquidity1
  } else {
    return getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1)
  }
}

function getLiquidityForAmount0Imprecise(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount0: JSBI): JSBI {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }
  const intermediate = JSBI.divide(JSBI.multiply(sqrtRatioAX96, sqrtRatioBX96), Q96)
  return JSBI.divide(JSBI.multiply(amount0, intermediate), JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96))
}

function getLiquidityForAmount0Precise(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount0: JSBI): JSBI {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }

  const numerator = JSBI.multiply(JSBI.multiply(amount0, sqrtRatioAX96), sqrtRatioBX96)
  const denominator = JSBI.multiply(Q96, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96))

  return JSBI.divide(numerator, denominator)
}

function getLiquidityForAmount1Precise(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount1: JSBI): JSBI {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }
  return JSBI.divide(JSBI.multiply(amount1, Q96), JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96))
}
