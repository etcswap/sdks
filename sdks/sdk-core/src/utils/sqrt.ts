import JSBI from 'jsbi'
import { ONE } from '../constants'

const MAX_SAFE_INTEGER = JSBI.BigInt(Number.MAX_SAFE_INTEGER)

/**
 * Computes floor(sqrt(value))
 * @param value the value for which to compute the square root, rounded down
 */
export function sqrt(value: JSBI): JSBI {
  // Rely on built-in sqrt if the value is small
  if (JSBI.lessThan(value, MAX_SAFE_INTEGER)) {
    return JSBI.BigInt(Math.floor(Math.sqrt(JSBI.toNumber(value))))
  }

  let z: JSBI = value
  let x: JSBI = JSBI.add(JSBI.divide(value, JSBI.BigInt(2)), ONE)

  while (JSBI.lessThan(x, z)) {
    z = x
    x = JSBI.divide(JSBI.add(JSBI.divide(value, x), x), JSBI.BigInt(2))
  }

  return z
}
