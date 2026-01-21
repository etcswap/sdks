/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'toformat' {
  function toFormat<T>(ctor: T): T
  export default toFormat
}

// Type augmentations for decimal.js-light and big.js after toFormat is applied
declare module 'decimal.js-light' {
  export default class Decimal {
    constructor(value: string | number | Decimal)
    static ROUND_DOWN: number
    static ROUND_HALF_UP: number
    static ROUND_UP: number
    static set(config: { precision?: number; rounding?: number }): void
    div(value: string | number | Decimal): Decimal
    toSignificantDigits(significantDigits: number): Decimal
    decimalPlaces(): number
    toFormat(decimalPlaces?: number, format?: any): string
  }
}

declare module 'big.js' {
  export default class Big {
    constructor(value: string | number | Big)
    static DP: number
    static RM: number
    div(value: string | number | Big): Big
    toFormat(format?: any): string
    toFormat(decimalPlaces: number, format?: any): string
  }
}
