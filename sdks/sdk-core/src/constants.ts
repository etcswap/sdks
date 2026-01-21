import JSBI from 'jsbi'

// Type for numeric values that can be converted to JSBI
export type BigintIsh = JSBI | string | number

// Useful math constants
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const _100 = JSBI.BigInt(100)
export const _9975 = JSBI.BigInt(9975)
export const _10000 = JSBI.BigInt(10000)

// Max uint256
export const MaxUint256 = JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

// Rounding modes
export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP,
}

// Trade types
export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT,
}
