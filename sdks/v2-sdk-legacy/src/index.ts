/**
 * ETCswap SDK Legacy - Non-generic V2 SDK for Ethereum Classic
 *
 * This SDK provides a Uniswap V2-compatible API (non-generic classes) for
 * ETCswap V2 protocol on Ethereum Classic chains.
 *
 * Use this SDK when migrating from the original Uniswap V2 interface or
 * when you need the simpler non-generic API.
 *
 * For new projects, consider using @etcswapv2/sdk which provides a
 * modern generics-based API.
 */

import { getAddress, keccak256, concat, toBytes } from 'viem'

// Compute CREATE2 address for Uniswap V2 pairs
// Formula: keccak256(0xff ++ factory ++ salt ++ initCodeHash)[12:]
// where salt = keccak256(abi.encodePacked(token0, token1))
function computeCreate2Address(
  factoryAddress: string,
  token0Address: string,
  token1Address: string,
  initCodeHash: string
): string {
  // Compute salt = keccak256(abi.encodePacked(token0, token1))
  const salt = keccak256(
    concat([
      toBytes(token0Address as `0x${string}`),
      toBytes(token1Address as `0x${string}`),
    ])
  )

  // CREATE2 address = keccak256(0xff ++ factory ++ salt ++ initCodeHash)[12:]
  const create2Input = concat([
    toBytes('0xff'),
    toBytes(factoryAddress as `0x${string}`),
    toBytes(salt),
    toBytes(initCodeHash as `0x${string}`),
  ])

  const hash = keccak256(create2Input)
  // Take last 20 bytes (40 hex chars) and checksum
  return getAddress(`0x${hash.slice(-40)}`)
}

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GÖRLI = 5,
  KOVAN = 42,
  CLASSIC = 61,
  MORDOR = 63,
}

export const SUPPORTED_CHAINS = [ChainId.CLASSIC, ChainId.MORDOR] as const

// Base currency (native ETC)
export class Ether {
  public readonly decimals = 18
  public readonly symbol = 'ETC'
  public readonly name = 'Ether'

  private constructor() {}

  private static _instance: Ether
  public static get Instance(): Ether {
    return this._instance || (this._instance = new Ether())
  }
}

export const ETHER = Ether.Instance

// Token class
export class Token {
  public readonly chainId: ChainId
  public readonly address: string
  public readonly decimals: number
  public readonly symbol?: string
  public readonly name?: string

  constructor(
    chainId: ChainId,
    address: string,
    decimals: number,
    symbol?: string,
    name?: string
  ) {
    this.chainId = chainId
    this.address = address.toLowerCase()
    this.decimals = decimals
    this.symbol = symbol
    this.name = name
  }

  public equals(other: Token): boolean {
    return this.chainId === other.chainId && this.address === other.address
  }

  public sortsBefore(other: Token): boolean {
    return this.address.toLowerCase() < other.address.toLowerCase()
  }
}

// WETC addresses per chain
export const WETC: { [chainId in ChainId]?: Token } = {
  [ChainId.CLASSIC]: new Token(
    ChainId.CLASSIC,
    '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a',
    18,
    'WETC',
    'Wrapped Ether'
  ),
  [ChainId.MORDOR]: new Token(
    ChainId.MORDOR,
    '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a',
    18,
    'WETC',
    'Wrapped Ether'
  ),
}

// Also export as WETH for compatibility
export const WETH = WETC

// Currency type (Token or Ether)
export type Currency = Token | typeof ETHER

// Fraction class
export class Fraction {
  public readonly numerator: bigint
  public readonly denominator: bigint

  constructor(numerator: bigint | number | string, denominator: bigint | number | string = 1n) {
    this.numerator = BigInt(numerator)
    this.denominator = BigInt(denominator)
  }

  public get quotient(): bigint {
    return this.numerator / this.denominator
  }

  public invert(): Fraction {
    return new Fraction(this.denominator, this.numerator)
  }

  public add(other: Fraction | bigint): Fraction {
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    if (this.denominator === otherFraction.denominator) {
      return new Fraction(this.numerator + otherFraction.numerator, this.denominator)
    }
    return new Fraction(
      this.numerator * otherFraction.denominator + otherFraction.numerator * this.denominator,
      this.denominator * otherFraction.denominator
    )
  }

  public subtract(other: Fraction | bigint): Fraction {
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    if (this.denominator === otherFraction.denominator) {
      return new Fraction(this.numerator - otherFraction.numerator, this.denominator)
    }
    return new Fraction(
      this.numerator * otherFraction.denominator - otherFraction.numerator * this.denominator,
      this.denominator * otherFraction.denominator
    )
  }

  public multiply(other: Fraction | bigint): Fraction {
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    return new Fraction(
      this.numerator * otherFraction.numerator,
      this.denominator * otherFraction.denominator
    )
  }

  public divide(other: Fraction | bigint): Fraction {
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    return new Fraction(
      this.numerator * otherFraction.denominator,
      this.denominator * otherFraction.numerator
    )
  }

  public lessThan(other: Fraction | bigint): boolean {
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    return this.numerator * otherFraction.denominator < otherFraction.numerator * this.denominator
  }

  public greaterThan(other: Fraction | bigint): boolean {
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    return this.numerator * otherFraction.denominator > otherFraction.numerator * this.denominator
  }

  public equalTo(other: Fraction | bigint): boolean {
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    return this.numerator * otherFraction.denominator === otherFraction.numerator * this.denominator
  }

  public toSignificant(significantDigits = 6): string {
    const value = Number(this.numerator) / Number(this.denominator)
    return value.toPrecision(significantDigits)
  }

  public toFixed(decimalPlaces = 4): string {
    const value = Number(this.numerator) / Number(this.denominator)
    return value.toFixed(decimalPlaces)
  }
}

// Percent class (extends Fraction logic)
export class Percent extends Fraction {
  constructor(numerator: bigint | number | string, denominator: bigint | number | string = 100n) {
    super(numerator, denominator)
  }

  public override toFixed(decimalPlaces = 2): string {
    return ((Number(this.numerator) / Number(this.denominator)) * 100).toFixed(decimalPlaces)
  }

  public override toSignificant(significantDigits = 3): string {
    return ((Number(this.numerator) / Number(this.denominator)) * 100).toPrecision(significantDigits)
  }

  public override add(other: Fraction | bigint): Percent {
    const result = super.add(other)
    return new Percent(result.numerator, result.denominator)
  }

  public override subtract(other: Fraction | bigint): Percent {
    const result = super.subtract(other)
    return new Percent(result.numerator, result.denominator)
  }

  public override multiply(other: Fraction | bigint): Percent {
    const result = super.multiply(other)
    return new Percent(result.numerator, result.denominator)
  }
}

// Token amount
export class TokenAmount extends Fraction {
  public readonly token: Token
  public readonly raw: bigint

  constructor(token: Token, amount: bigint | string | number) {
    const rawAmount = BigInt(amount)
    super(rawAmount, BigInt(10 ** token.decimals))
    this.token = token
    this.raw = rawAmount
  }

  public get currency(): Token {
    return this.token
  }

  public toExact(): string {
    const divisor = BigInt(10 ** this.token.decimals)
    const quotient = this.raw / divisor
    const remainder = this.raw % divisor
    if (remainder === 0n) {
      return quotient.toString()
    }
    const remainderStr = remainder.toString().padStart(this.token.decimals, '0')
    return `${quotient}.${remainderStr}`.replace(/\.?0+$/, '')
  }

  public override toSignificant(significantDigits = 6): string {
    return parseFloat(this.toExact()).toPrecision(significantDigits)
  }

  public add(other: TokenAmount): TokenAmount {
    if (!this.token.equals(other.token)) throw new Error('TOKEN')
    return new TokenAmount(this.token, this.raw + other.raw)
  }

  public override subtract(other: TokenAmount | Fraction | bigint): TokenAmount {
    if (other instanceof TokenAmount) {
      if (!this.token.equals(other.token)) throw new Error('TOKEN')
      return new TokenAmount(this.token, this.raw - other.raw)
    }
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    return new TokenAmount(this.token, this.raw - otherFraction.numerator)
  }

  public override greaterThan(other: TokenAmount | Fraction | bigint): boolean {
    if (other instanceof TokenAmount) {
      return this.raw > other.raw
    }
    return super.greaterThan(other)
  }

  public override lessThan(other: TokenAmount | Fraction | bigint): boolean {
    if (other instanceof TokenAmount) {
      return this.raw < other.raw
    }
    return super.lessThan(other)
  }

  public override equalTo(other: TokenAmount | Fraction | bigint): boolean {
    if (other instanceof TokenAmount) {
      return this.raw === other.raw
    }
    return super.equalTo(other)
  }
}

// Helper to get decimals from a currency (avoids instanceof issues with module duplication)
function getCurrencyDecimals(currency: Currency): number {
  // Check for 'decimals' property instead of instanceof to avoid module duplication issues
  if (currency && typeof currency === 'object' && 'decimals' in currency) {
    return (currency as { decimals: number }).decimals
  }
  return 18 // Default for native currency (ETC/ETHER)
}

// Currency amount (handles both Token and Ether)
export class CurrencyAmount extends Fraction {
  public readonly currency: Currency
  public readonly raw: bigint

  constructor(currency: Currency, amount: bigint | string | number) {
    const decimals = getCurrencyDecimals(currency)
    const rawAmount = BigInt(amount)
    super(rawAmount, BigInt(10 ** decimals))
    this.currency = currency
    this.raw = rawAmount
  }

  public static ether(amount: bigint | string | number): CurrencyAmount {
    return new CurrencyAmount(ETHER, amount)
  }

  public toExact(): string {
    const decimals = getCurrencyDecimals(this.currency)
    const divisor = BigInt(10 ** decimals)
    const quotient = this.raw / divisor
    const remainder = this.raw % divisor
    if (remainder === 0n) {
      return quotient.toString()
    }
    const remainderStr = remainder.toString().padStart(decimals, '0')
    return `${quotient}.${remainderStr}`.replace(/\.?0+$/, '')
  }

  public override toSignificant(significantDigits = 6): string {
    return parseFloat(this.toExact()).toPrecision(significantDigits)
  }

  public add(other: CurrencyAmount): CurrencyAmount {
    return new CurrencyAmount(this.currency, this.raw + other.raw)
  }

  public override subtract(other: CurrencyAmount | Fraction | bigint): CurrencyAmount {
    if (other instanceof CurrencyAmount) {
      return new CurrencyAmount(this.currency, this.raw - other.raw)
    }
    const otherFraction = other instanceof Fraction ? other : new Fraction(other)
    return new CurrencyAmount(this.currency, this.raw - otherFraction.numerator)
  }

  public override greaterThan(other: CurrencyAmount | Fraction | bigint): boolean {
    if (other instanceof CurrencyAmount) {
      return this.raw > other.raw
    }
    return super.greaterThan(other)
  }
}

// Price
export class Price extends Fraction {
  public readonly baseCurrency: Currency
  public readonly quoteCurrency: Currency
  public readonly scalar: Fraction

  constructor(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    denominator: bigint | string | number,
    numerator: bigint | string | number
  ) {
    super(numerator, denominator)
    this.baseCurrency = baseCurrency
    this.quoteCurrency = quoteCurrency
    // Scale by decimal differences - use helper to avoid instanceof issues
    const baseDecimals = getCurrencyDecimals(baseCurrency)
    const quoteDecimals = getCurrencyDecimals(quoteCurrency)
    this.scalar = new Fraction(
      BigInt(10 ** baseDecimals),
      BigInt(10 ** quoteDecimals)
    )
  }

  public get raw(): Fraction {
    return new Fraction(this.numerator, this.denominator)
  }

  public get adjusted(): Fraction {
    return this.raw.multiply(this.scalar)
  }

  public override invert(): Price {
    return new Price(this.quoteCurrency, this.baseCurrency, this.numerator, this.denominator)
  }

  public override multiply(other: Price): Price {
    return new Price(
      this.baseCurrency,
      other.quoteCurrency,
      this.denominator * other.denominator,
      this.numerator * other.numerator
    )
  }

  public quote(currencyAmount: CurrencyAmount): CurrencyAmount {
    // Use raw price ratio (not adjusted) to preserve correct decimal scaling
    // Example: 1 ETC (10^18 raw) at price 20 USDT/ETC (reserves: 20*10^6 USDT / 1*10^18 ETC)
    // Result: (10^18 * 20*10^6) / 10^18 = 20*10^6 raw USDT (correct!)
    return new CurrencyAmount(
      this.quoteCurrency,
      (currencyAmount.raw * this.numerator) / this.denominator
    )
  }

  public override toSignificant(significantDigits = 6): string {
    return this.adjusted.toSignificant(significantDigits)
  }

  public override toFixed(decimalPlaces = 4): string {
    return this.adjusted.toFixed(decimalPlaces)
  }
}

// Pair (simplified)
export class Pair {
  public readonly token0: Token
  public readonly token1: Token
  public readonly reserve0: TokenAmount
  public readonly reserve1: TokenAmount
  public readonly liquidityToken: Token

  constructor(tokenAmountA: TokenAmount, tokenAmountB: TokenAmount) {
    const [token0Amount, token1Amount] = tokenAmountA.token.sortsBefore(tokenAmountB.token)
      ? [tokenAmountA, tokenAmountB]
      : [tokenAmountB, tokenAmountA]

    this.token0 = token0Amount.token
    this.token1 = token1Amount.token
    this.reserve0 = token0Amount
    this.reserve1 = token1Amount

    // LP token address computed from factory
    const pairAddress = Pair.getAddress(this.token0, this.token1)
    this.liquidityToken = new Token(
      this.token0.chainId,
      pairAddress,
      18,
      'ETC-V2',
      'ETCswap V2'
    )
  }

  public static getAddress(tokenA: Token, tokenB: Token): string {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    const chainId = token0.chainId
    const factoryAddress = FACTORY_ADDRESS[chainId]
    const initCodeHash = INIT_CODE_HASH[chainId]

    if (!factoryAddress || !initCodeHash) {
      throw new Error(`Unsupported chain ${chainId}`)
    }

    // Compute CREATE2 address: keccak256(0xff ++ factory ++ salt ++ initCodeHash)[12:]
    // Salt = keccak256(abi.encodePacked(token0, token1))
    return computeCreate2Address(
      factoryAddress,
      token0.address,
      token1.address,
      initCodeHash
    )
  }

  public get token0Price(): Price {
    return new Price(this.token0, this.token1, this.reserve0.raw, this.reserve1.raw)
  }

  public get token1Price(): Price {
    return new Price(this.token1, this.token0, this.reserve1.raw, this.reserve0.raw)
  }

  public priceOf(token: Token): Price {
    return token.equals(this.token0) ? this.token0Price : this.token1Price
  }

  public reserveOf(token: Token): TokenAmount {
    return token.equals(this.token0) ? this.reserve0 : this.reserve1
  }

  public involvesToken(token: Token): boolean {
    return token.equals(this.token0) || token.equals(this.token1)
  }

  public getLiquidityValue(token: Token, totalSupply: TokenAmount, liquidity: TokenAmount, _feeOn?: boolean): TokenAmount {
    if (!totalSupply.token.equals(this.liquidityToken)) throw new Error('TOTAL_SUPPLY')
    if (!liquidity.token.equals(this.liquidityToken)) throw new Error('LIQUIDITY')
    if (liquidity.raw > totalSupply.raw) throw new Error('LIQUIDITY')

    const reserve = this.reserveOf(token)
    return new TokenAmount(token, (liquidity.raw * reserve.raw) / totalSupply.raw)
  }

  /**
   * Returns the amount of liquidity tokens that would be minted given the deposited amounts
   */
  public getLiquidityMinted(
    totalSupply: TokenAmount,
    tokenAmountA: TokenAmount,
    tokenAmountB: TokenAmount
  ): TokenAmount {
    if (!totalSupply.token.equals(this.liquidityToken)) throw new Error('LIQUIDITY')

    const tokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token)
      ? [tokenAmountA, tokenAmountB]
      : [tokenAmountB, tokenAmountA]

    const amount0 = tokenAmounts[0].raw
    const amount1 = tokenAmounts[1].raw

    if (totalSupply.raw === 0n) {
      // New pool - use geometric mean minus minimum liquidity
      const sqrt = (n: bigint): bigint => {
        if (n < 0n) throw new Error('NEGATIVE')
        if (n < 2n) return n
        let x = n
        let y = (x + 1n) / 2n
        while (y < x) {
          x = y
          y = (x + n / x) / 2n
        }
        return x
      }
      const liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
      return new TokenAmount(this.liquidityToken, liquidity)
    } else {
      // Existing pool - use minimum of the two proportional amounts
      const liquidity0 = (amount0 * totalSupply.raw) / this.reserve0.raw
      const liquidity1 = (amount1 * totalSupply.raw) / this.reserve1.raw
      const liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1
      return new TokenAmount(this.liquidityToken, liquidity)
    }
  }
}

// Trade types
export enum TradeType {
  EXACT_INPUT = 0,
  EXACT_OUTPUT = 1,
}

// Route
export class Route {
  public readonly pairs: Pair[]
  public readonly path: Token[]
  public readonly input: Currency
  public readonly output: Currency

  constructor(pairs: Pair[], input: Currency, output?: Currency) {
    this.pairs = pairs
    this.path = pairs.reduce<Token[]>((path, pair) => {
      const inputToken = path[path.length - 1]
      const outputToken = pair.token0.equals(inputToken) ? pair.token1 : pair.token0
      return [...path, outputToken]
    }, [input instanceof Token ? input : WETC[pairs[0].token0.chainId]!])
    this.input = input
    this.output = output ?? this.path[this.path.length - 1]
  }

  public get midPrice(): Price {
    const prices = this.pairs.map((pair, i) => pair.priceOf(this.path[i]))
    return prices.reduce((acc, price) => {
      return new Price(
        acc.baseCurrency,
        price.quoteCurrency,
        acc.denominator * price.denominator,
        acc.numerator * price.numerator
      )
    })
  }
}

// AMM math helpers
function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n) throw new Error('INSUFFICIENT_INPUT_AMOUNT')
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('INSUFFICIENT_LIQUIDITY')
  const amountInWithFee = amountIn * 997n
  const numerator = amountInWithFee * reserveOut
  const denominator = reserveIn * 1000n + amountInWithFee
  return numerator / denominator
}

function getAmountIn(amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountOut <= 0n) throw new Error('INSUFFICIENT_OUTPUT_AMOUNT')
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('INSUFFICIENT_LIQUIDITY')
  const numerator = reserveIn * amountOut * 1000n
  const denominator = (reserveOut - amountOut) * 997n
  return numerator / denominator + 1n
}

// Trade with proper AMM calculations
export class Trade {
  public readonly route: Route
  public readonly tradeType: TradeType
  public readonly inputAmount: CurrencyAmount
  public readonly outputAmount: CurrencyAmount
  public readonly priceImpact: Percent

  constructor(
    route: Route,
    amount: CurrencyAmount,
    tradeType: TradeType
  ) {
    this.route = route
    this.tradeType = tradeType

    // Calculate amounts through the route using AMM math
    if (tradeType === TradeType.EXACT_INPUT) {
      this.inputAmount = amount
      // Calculate output through each pair in the route
      let currentAmount = amount.raw
      for (let i = 0; i < route.pairs.length; i++) {
        const pair = route.pairs[i]
        const inputToken = route.path[i]
        const [reserveIn, reserveOut] = inputToken.equals(pair.token0)
          ? [pair.reserve0.raw, pair.reserve1.raw]
          : [pair.reserve1.raw, pair.reserve0.raw]
        currentAmount = getAmountOut(currentAmount, reserveIn, reserveOut)
      }
      this.outputAmount = new CurrencyAmount(route.output, currentAmount)
    } else {
      this.outputAmount = amount
      // Calculate input through each pair in reverse
      let currentAmount = amount.raw
      for (let i = route.pairs.length - 1; i >= 0; i--) {
        const pair = route.pairs[i]
        const outputToken = route.path[i + 1]
        const [reserveIn, reserveOut] = outputToken.equals(pair.token0)
          ? [pair.reserve1.raw, pair.reserve0.raw]
          : [pair.reserve0.raw, pair.reserve1.raw]
        currentAmount = getAmountIn(currentAmount, reserveIn, reserveOut)
      }
      this.inputAmount = new CurrencyAmount(route.input, currentAmount)
    }

    // Calculate price impact
    // Price impact = (execution price - mid price) / mid price
    const midPrice = route.midPrice
    const executionPrice = this.executionPrice
    // Calculate as: 1 - (midPrice / executionPrice) for exact input
    // This gives positive impact when execution price is worse
    const midPriceValue = Number(midPrice.adjusted.numerator) / Number(midPrice.adjusted.denominator)
    const execPriceValue = Number(executionPrice.adjusted.numerator) / Number(executionPrice.adjusted.denominator)
    let priceImpactPct = 0
    if (execPriceValue > 0 && midPriceValue > 0) {
      if (tradeType === TradeType.EXACT_INPUT) {
        // For exact input, higher execution price (more input per output) = worse
        priceImpactPct = Math.abs((execPriceValue - midPriceValue) / midPriceValue) * 100
      } else {
        priceImpactPct = Math.abs((midPriceValue - execPriceValue) / midPriceValue) * 100
      }
    }
    // Convert to basis points (multiply by 100 for percent, store as bips)
    const priceImpactBips = Math.round(priceImpactPct * 100)
    this.priceImpact = new Percent(BigInt(priceImpactBips), 10000n)
  }

  public get executionPrice(): Price {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.raw,
      this.outputAmount.raw
    )
  }

  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount {
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount
    }
    const slippageAdjustedAmountOut = new Fraction(1n)
      .add(slippageTolerance)
      .invert()
      .multiply(new Fraction(this.outputAmount.raw)).quotient
    return new CurrencyAmount(this.outputAmount.currency, slippageAdjustedAmountOut)
  }

  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount {
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount
    }
    const slippageAdjustedAmountIn = new Fraction(1n)
      .add(slippageTolerance)
      .multiply(new Fraction(this.inputAmount.raw)).quotient
    return new CurrencyAmount(this.inputAmount.currency, slippageAdjustedAmountIn)
  }

  public static exactIn(route: Route, amountIn: CurrencyAmount): Trade {
    return new Trade(route, amountIn, TradeType.EXACT_INPUT)
  }

  public static exactOut(route: Route, amountOut: CurrencyAmount): Trade {
    return new Trade(route, amountOut, TradeType.EXACT_OUTPUT)
  }

  public static bestTradeExactIn(
    pairs: Pair[],
    currencyAmountIn: CurrencyAmount,
    currencyOut: Currency,
    _options: { maxHops?: number; maxNumResults?: number } = {}
  ): Trade[] {
    // Simplified: just find direct route if available
    const inputToken = currencyAmountIn.currency instanceof Token
      ? currencyAmountIn.currency
      : WETC[pairs[0]?.token0.chainId]

    if (!inputToken) return []

    for (const pair of pairs) {
      if (pair.involvesToken(inputToken as Token)) {
        const outputToken = pair.token0.equals(inputToken as Token) ? pair.token1 : pair.token0
        const outputCurrency = currencyOut instanceof Token ? currencyOut : WETC[outputToken.chainId]
        if (outputCurrency && outputToken.equals(outputCurrency as Token)) {
          const route = new Route([pair], currencyAmountIn.currency, currencyOut)
          return [new Trade(route, currencyAmountIn, TradeType.EXACT_INPUT)]
        }
      }
    }
    return []
  }

  public static bestTradeExactOut(
    pairs: Pair[],
    currencyIn: Currency,
    currencyAmountOut: CurrencyAmount,
    _options: { maxHops?: number; maxNumResults?: number } = {}
  ): Trade[] {
    // Simplified: just find direct route if available
    const outputToken = currencyAmountOut.currency instanceof Token
      ? currencyAmountOut.currency
      : WETC[pairs[0]?.token0.chainId]

    if (!outputToken) return []

    for (const pair of pairs) {
      if (pair.involvesToken(outputToken as Token)) {
        const inputToken = pair.token0.equals(outputToken as Token) ? pair.token1 : pair.token0
        const inputCurrency = currencyIn instanceof Token ? currencyIn : WETC[inputToken.chainId]
        if (inputCurrency && inputToken.equals(inputCurrency as Token)) {
          const route = new Route([pair], currencyIn, currencyAmountOut.currency)
          return [new Trade(route, currencyAmountOut, TradeType.EXACT_OUTPUT)]
        }
      }
    }
    return []
  }
}

// JSBI compatibility (use native BigInt)
export const JSBI = {
  BigInt: (value: string | number | bigint) => BigInt(value),
  add: (a: bigint, b: bigint) => a + b,
  subtract: (a: bigint, b: bigint) => a - b,
  multiply: (a: bigint, b: bigint) => a * b,
  divide: (a: bigint, b: bigint) => a / b,
  remainder: (a: bigint, b: bigint) => a % b,
  exponentiate: (a: bigint, b: bigint) => a ** b,
  greaterThan: (a: bigint, b: bigint) => a > b,
  greaterThanOrEqual: (a: bigint, b: bigint) => a >= b,
  lessThan: (a: bigint, b: bigint) => a < b,
  lessThanOrEqual: (a: bigint, b: bigint) => a <= b,
  equal: (a: bigint, b: bigint) => a === b,
  notEqual: (a: bigint, b: bigint) => a !== b,
}

// Rounding modes
export enum Rounding {
  ROUND_DOWN = 0,
  ROUND_HALF_UP = 1,
  ROUND_UP = 2,
}

// Export utilities
export function currencyEquals(a: Currency, b: Currency): boolean {
  if (a === ETHER && b === ETHER) return true
  if (a instanceof Token && b instanceof Token) return a.equals(b)
  return false
}

// Constants - ETCswap V2 Contract Addresses
export const FACTORY_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.CLASSIC]: '0x0307cd3D7DA98A29e6Ed0D2137be386Ec1e4Bc9C',
  [ChainId.MORDOR]: '0x212eE1B5c8C26ff5B2c4c14CD1C54486Fe23ce70',
}

export const ROUTER_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.CLASSIC]: '0x79Bf07555C34e68C4Ae93642d1007D7f908d60F5',
  [ChainId.MORDOR]: '0x6d194227a9A1C11f144B35F96E6289c5602Da493',
}

export const INIT_CODE_HASH: { [chainId in ChainId]?: string } = {
  [ChainId.CLASSIC]: '0xb5e58237f3a44220ffc3dfb989e53735df8fcd9df82c94b13105be8380344e52',
  [ChainId.MORDOR]: '0x4d8a51f257ed377a6ac3f829cd4226c892edbbbcb87622bcc232807b885b1303',
}

export const MINIMUM_LIQUIDITY = 1000n

// Swap parameters interface
export interface SwapParameters {
  methodName: string
  args: (string | string[])[]
  value: string
}

// Router helper for generating swap call parameters
export class Router {
  public static swapCallParameters(
    trade: Trade,
    options: {
      allowedSlippage: Percent
      recipient: string
      deadline: number
      ttl?: number
      feeOnTransfer?: boolean
    }
  ): SwapParameters {
    const etherIn = !(trade.inputAmount.currency instanceof Token)
    const etherOut = !(trade.outputAmount.currency instanceof Token)

    // Determine the method name based on input/output types
    // ETCswap uses ETC instead of ETH in method names
    let methodName: string
    if (trade.tradeType === TradeType.EXACT_INPUT) {
      if (etherIn) {
        methodName = options.feeOnTransfer ? 'swapExactETCForTokensSupportingFeeOnTransferTokens' : 'swapExactETCForTokens'
      } else if (etherOut) {
        methodName = options.feeOnTransfer ? 'swapExactTokensForETCSupportingFeeOnTransferTokens' : 'swapExactTokensForETC'
      } else {
        methodName = options.feeOnTransfer ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens' : 'swapExactTokensForTokens'
      }
    } else {
      if (etherIn) {
        methodName = 'swapETCForExactTokens'
      } else if (etherOut) {
        methodName = 'swapTokensForExactETC'
      } else {
        methodName = 'swapTokensForExactTokens'
      }
    }

    // Build the path
    const path = trade.route.path.map(token => token.address)

    // Calculate amounts with slippage
    const amountIn = trade.maximumAmountIn(options.allowedSlippage).raw.toString()
    const amountOut = trade.minimumAmountOut(options.allowedSlippage).raw.toString()

    const deadline = options.deadline.toString()

    // Build args based on method
    let args: (string | string[])[]
    let value = '0'

    if (trade.tradeType === TradeType.EXACT_INPUT) {
      if (etherIn) {
        args = [amountOut, path, options.recipient, deadline]
        value = amountIn
      } else if (etherOut) {
        args = [amountIn, amountOut, path, options.recipient, deadline]
      } else {
        args = [amountIn, amountOut, path, options.recipient, deadline]
      }
    } else {
      if (etherIn) {
        args = [amountOut, path, options.recipient, deadline]
        value = amountIn
      } else if (etherOut) {
        args = [amountOut, amountIn, path, options.recipient, deadline]
      } else {
        args = [amountOut, amountIn, path, options.recipient, deadline]
      }
    }

    return { methodName, args, value }
  }
}
