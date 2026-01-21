import { Currency, CurrencyAmount, Fraction, Percent, Price, sortedInsert, Token, TradeType } from '@etcswapv2/sdk-core'
import invariant from 'tiny-invariant'

import { ONE, ZERO } from '../constants'
import { Pool } from './pool'
import { Route } from './route'

/**
 * Trades are made up of multiple routes
 */
export interface Swap<TInput extends Currency, TOutput extends Currency> {
  route: Route<TInput, TOutput>
  inputAmount: CurrencyAmount<TInput>
  outputAmount: CurrencyAmount<TOutput>
}

/**
 * Represents a trade executed against a set of routes
 */
export class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  /**
   * The route of the trade
   */
  public readonly swaps: Swap<TInput, TOutput>[]

  /**
   * The type of the trade
   */
  public readonly tradeType: TTradeType

  private _inputAmount: CurrencyAmount<TInput> | undefined
  private _outputAmount: CurrencyAmount<TOutput> | undefined
  private _executionPrice: Price<TInput, TOutput> | undefined
  private _priceImpact: Percent | undefined

  /**
   * Constructs a trade by simulating swaps through the given routes
   * @param routes The routes to take for this trade
   * @param tradeType The type of the trade
   */
  private constructor(
    routes: { route: Route<TInput, TOutput>; inputAmount: CurrencyAmount<TInput>; outputAmount: CurrencyAmount<TOutput> }[],
    tradeType: TTradeType
  ) {
    this.swaps = routes
    this.tradeType = tradeType
  }

  /**
   * The input amount for the trade
   */
  public get inputAmount(): CurrencyAmount<TInput> {
    if (this._inputAmount) {
      return this._inputAmount
    }

    const inputCurrency = this.swaps[0].inputAmount.currency
    const totalInputFromRoutes = this.swaps
      .map(({ inputAmount }) => inputAmount)
      .reduce((total, cur) => total.add(cur), CurrencyAmount.fromRawAmount(inputCurrency, 0))

    this._inputAmount = totalInputFromRoutes
    return this._inputAmount
  }

  /**
   * The output amount for the trade
   */
  public get outputAmount(): CurrencyAmount<TOutput> {
    if (this._outputAmount) {
      return this._outputAmount
    }

    const outputCurrency = this.swaps[0].outputAmount.currency
    const totalOutputFromRoutes = this.swaps
      .map(({ outputAmount }) => outputAmount)
      .reduce((total, cur) => total.add(cur), CurrencyAmount.fromRawAmount(outputCurrency, 0))

    this._outputAmount = totalOutputFromRoutes
    return this._outputAmount
  }

  /**
   * The price expressed in terms of output amount/input amount
   */
  public get executionPrice(): Price<TInput, TOutput> {
    return (
      this._executionPrice ??
      (this._executionPrice = new Price(
        this.inputAmount.currency,
        this.outputAmount.currency,
        this.inputAmount.quotient,
        this.outputAmount.quotient
      ))
    )
  }

  /**
   * Returns the percent difference between the route's mid price and the price impact
   */
  public get priceImpact(): Percent {
    if (this._priceImpact) {
      return this._priceImpact
    }

    let spotOutputAmount = CurrencyAmount.fromRawAmount(this.outputAmount.currency, 0)
    for (const { route, inputAmount } of this.swaps) {
      const midPrice = route.midPrice
      spotOutputAmount = spotOutputAmount.add(midPrice.quote(inputAmount))
    }

    const priceImpact = spotOutputAmount.subtract(this.outputAmount).divide(spotOutputAmount)
    this._priceImpact = new Percent(priceImpact.numerator, priceImpact.denominator)
    return this._priceImpact
  }

  /**
   * Constructs an exact in trade with the given amount in and route
   * @param route The route of the exact in trade
   * @param amountIn The amount being passed in
   * @returns The exact in trade
   */
  public static async exactIn<TInput extends Currency, TOutput extends Currency>(
    route: Route<TInput, TOutput>,
    amountIn: CurrencyAmount<TInput>
  ): Promise<Trade<TInput, TOutput, TradeType.EXACT_INPUT>> {
    return Trade.fromRoute(route, amountIn, TradeType.EXACT_INPUT)
  }

  /**
   * Constructs an exact out trade with the given amount out and route
   * @param route The route of the exact out trade
   * @param amountOut The amount returned by the trade
   * @returns The exact out trade
   */
  public static async exactOut<TInput extends Currency, TOutput extends Currency>(
    route: Route<TInput, TOutput>,
    amountOut: CurrencyAmount<TOutput>
  ): Promise<Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>> {
    return Trade.fromRoute(route, amountOut, TradeType.EXACT_OUTPUT)
  }

  /**
   * Constructs a trade from a route and amount
   * @param route The route of the trade
   * @param amount The amount specified, either input or output, depending on tradeType
   * @param tradeType The type of the trade, either exact in or exact out
   * @returns The trade
   */
  public static async fromRoute<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
    route: Route<TInput, TOutput>,
    amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>,
    tradeType: TTradeType
  ): Promise<Trade<TInput, TOutput, TTradeType>> {
    const amounts: CurrencyAmount<Token>[] = new Array(route.tokenPath.length)
    let inputAmount: CurrencyAmount<TInput>
    let outputAmount: CurrencyAmount<TOutput>

    if (tradeType === TradeType.EXACT_INPUT) {
      invariant(amount.currency.equals(route.input), 'INPUT')
      amounts[0] = amount.wrapped
      for (let i = 0; i < route.tokenPath.length - 1; i++) {
        const pool = route.pools[i]
        const [outputAmount] = await pool.getOutputAmount(amounts[i])
        amounts[i + 1] = outputAmount
      }
      inputAmount = CurrencyAmount.fromFractionalAmount(route.input, amount.numerator, amount.denominator) as CurrencyAmount<TInput>
      outputAmount = CurrencyAmount.fromFractionalAmount(
        route.output,
        amounts[amounts.length - 1].numerator,
        amounts[amounts.length - 1].denominator
      ) as CurrencyAmount<TOutput>
    } else {
      invariant(amount.currency.equals(route.output), 'OUTPUT')
      amounts[amounts.length - 1] = amount.wrapped
      for (let i = route.tokenPath.length - 1; i > 0; i--) {
        const pool = route.pools[i - 1]
        const [inputAmount] = await pool.getInputAmount(amounts[i])
        amounts[i - 1] = inputAmount
      }
      inputAmount = CurrencyAmount.fromFractionalAmount(
        route.input,
        amounts[0].numerator,
        amounts[0].denominator
      ) as CurrencyAmount<TInput>
      outputAmount = CurrencyAmount.fromFractionalAmount(route.output, amount.numerator, amount.denominator) as CurrencyAmount<TOutput>
    }

    return new Trade([{ route, inputAmount, outputAmount }], tradeType)
  }

  /**
   * Constructs a trade from routes
   * @param routes The routes to take for the trade
   * @param tradeType The type of the trade
   * @returns The trade
   */
  public static async fromRoutes<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
    routes: {
      amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>
      route: Route<TInput, TOutput>
    }[],
    tradeType: TTradeType
  ): Promise<Trade<TInput, TOutput, TTradeType>> {
    const populatedRoutes: { route: Route<TInput, TOutput>; inputAmount: CurrencyAmount<TInput>; outputAmount: CurrencyAmount<TOutput> }[] = []

    for (const { route, amount } of routes) {
      const amounts: CurrencyAmount<Token>[] = new Array(route.tokenPath.length)
      let inputAmount: CurrencyAmount<TInput>
      let outputAmount: CurrencyAmount<TOutput>

      if (tradeType === TradeType.EXACT_INPUT) {
        invariant(amount.currency.equals(route.input), 'INPUT')
        amounts[0] = amount.wrapped as CurrencyAmount<Token>
        for (let i = 0; i < route.tokenPath.length - 1; i++) {
          const pool = route.pools[i]
          const [outputAmount] = await pool.getOutputAmount(amounts[i])
          amounts[i + 1] = outputAmount
        }
        inputAmount = CurrencyAmount.fromFractionalAmount(route.input, amount.numerator, amount.denominator) as CurrencyAmount<TInput>
        outputAmount = CurrencyAmount.fromFractionalAmount(
          route.output,
          amounts[amounts.length - 1].numerator,
          amounts[amounts.length - 1].denominator
        ) as CurrencyAmount<TOutput>
      } else {
        invariant(amount.currency.equals(route.output), 'OUTPUT')
        amounts[amounts.length - 1] = amount.wrapped as CurrencyAmount<Token>
        for (let i = route.tokenPath.length - 1; i > 0; i--) {
          const pool = route.pools[i - 1]
          const [inputAmount] = await pool.getInputAmount(amounts[i])
          amounts[i - 1] = inputAmount
        }
        inputAmount = CurrencyAmount.fromFractionalAmount(
          route.input,
          amounts[0].numerator,
          amounts[0].denominator
        ) as CurrencyAmount<TInput>
        outputAmount = CurrencyAmount.fromFractionalAmount(route.output, amount.numerator, amount.denominator) as CurrencyAmount<TOutput>
      }

      populatedRoutes.push({ route, inputAmount, outputAmount })
    }

    return new Trade(populatedRoutes, tradeType)
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount out
   */
  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<TOutput> {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(this.outputAmount.quotient).quotient
      return CurrencyAmount.fromRawAmount(this.outputAmount.currency, slippageAdjustedAmountOut)
    }
  }

  /**
   * Get the maximum amount that should be spent on this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount in
   */
  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<TInput> {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE).add(slippageTolerance).multiply(this.inputAmount.quotient)
        .quotient
      return CurrencyAmount.fromRawAmount(this.inputAmount.currency, slippageAdjustedAmountIn)
    }
  }

  /**
   * Return the execution price after accounting for slippage tolerance
   * @param slippageTolerance the allowed tolerated slippage
   * @returns The execution price
   */
  public worstExecutionPrice(slippageTolerance: Percent): Price<TInput, TOutput> {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.maximumAmountIn(slippageTolerance).quotient,
      this.minimumAmountOut(slippageTolerance).quotient
    )
  }

  /**
   * Given a list of pools and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
   * to an output token, making at most `maxHops` hops.
   * @param pools the pools to consider
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param options options for maximum hops and results
   * @returns The trades
   */
  public static async bestTradeExactIn<TInput extends Currency, TOutput extends Currency>(
    pools: Pool[],
    currencyAmountIn: CurrencyAmount<TInput>,
    currencyOut: TOutput,
    { maxNumResults = 3, maxHops = 3 }: { maxNumResults?: number; maxHops?: number } = {},
    currentPools: Pool[] = [],
    nextAmountIn: CurrencyAmount<Currency> = currencyAmountIn,
    bestTrades: Trade<TInput, TOutput, TradeType.EXACT_INPUT>[] = []
  ): Promise<Trade<TInput, TOutput, TradeType.EXACT_INPUT>[]> {
    invariant(pools.length > 0, 'POOLS')
    invariant(maxHops > 0, 'MAX_HOPS')
    invariant(currencyAmountIn === nextAmountIn || currentPools.length > 0, 'INVALID_RECURSION')

    const amountIn = nextAmountIn.wrapped
    const tokenOut = currencyOut.wrapped

    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i]
      if (!pool.token0.equals(amountIn.currency) && !pool.token1.equals(amountIn.currency)) continue

      let amountOut: CurrencyAmount<Token>
      try {
        ;[amountOut] = await pool.getOutputAmount(amountIn)
      } catch (error) {
        continue
      }

      // we have arrived at the output token, so this is the final trade of one of the paths
      if (amountOut.currency.equals(tokenOut)) {
        sortedInsert(
          bestTrades,
          await Trade.fromRoute(
            new Route([...currentPools, pool], currencyAmountIn.currency, currencyOut),
            currencyAmountIn,
            TradeType.EXACT_INPUT
          ),
          maxNumResults,
          tradeComparator
        )
      } else if (maxHops > 1 && pools.length > 1) {
        const poolsExcludingThisPool = pools.slice(0, i).concat(pools.slice(i + 1, pools.length))

        // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
        await Trade.bestTradeExactIn(
          poolsExcludingThisPool,
          currencyAmountIn,
          currencyOut,
          {
            maxNumResults,
            maxHops: maxHops - 1,
          },
          [...currentPools, pool],
          amountOut,
          bestTrades
        )
      }
    }

    return bestTrades
  }

  /**
   * Given a list of pools and a fixed amount out, returns the top `maxNumResults` trades that go from an input token
   * to an output token amount, making at most `maxHops` hops.
   * @param pools the pools to consider
   * @param currencyIn the currency to spend
   * @param currencyAmountOut the desired currency amount out
   * @param options options for maximum hops and results
   * @returns The trades
   */
  public static async bestTradeExactOut<TInput extends Currency, TOutput extends Currency>(
    pools: Pool[],
    currencyIn: TInput,
    currencyAmountOut: CurrencyAmount<TOutput>,
    { maxNumResults = 3, maxHops = 3 }: { maxNumResults?: number; maxHops?: number } = {},
    currentPools: Pool[] = [],
    nextAmountOut: CurrencyAmount<Currency> = currencyAmountOut,
    bestTrades: Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[] = []
  ): Promise<Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[]> {
    invariant(pools.length > 0, 'POOLS')
    invariant(maxHops > 0, 'MAX_HOPS')
    invariant(currencyAmountOut === nextAmountOut || currentPools.length > 0, 'INVALID_RECURSION')

    const amountOut = nextAmountOut.wrapped
    const tokenIn = currencyIn.wrapped

    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i]
      if (!pool.token0.equals(amountOut.currency) && !pool.token1.equals(amountOut.currency)) continue

      let amountIn: CurrencyAmount<Token>
      try {
        ;[amountIn] = await pool.getInputAmount(amountOut)
      } catch (error) {
        continue
      }

      // we have arrived at the input token, so this is the first trade of one of the paths
      if (amountIn.currency.equals(tokenIn)) {
        sortedInsert(
          bestTrades,
          await Trade.fromRoute(
            new Route([pool, ...currentPools], currencyIn, currencyAmountOut.currency),
            currencyAmountOut,
            TradeType.EXACT_OUTPUT
          ),
          maxNumResults,
          tradeComparator
        )
      } else if (maxHops > 1 && pools.length > 1) {
        const poolsExcludingThisPool = pools.slice(0, i).concat(pools.slice(i + 1, pools.length))

        // otherwise, consider all the other paths that arrive at this token as long as we have not exceeded maxHops
        await Trade.bestTradeExactOut(
          poolsExcludingThisPool,
          currencyIn,
          currencyAmountOut,
          {
            maxNumResults,
            maxHops: maxHops - 1,
          },
          [pool, ...currentPools],
          amountIn,
          bestTrades
        )
      }
    }

    return bestTrades
  }
}

/**
 * Comparator function to sort trades
 */
export function tradeComparator<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
  a: Trade<TInput, TOutput, TTradeType>,
  b: Trade<TInput, TOutput, TTradeType>
): number {
  // must have same input and output token for comparison
  invariant(a.inputAmount.currency.equals(b.inputAmount.currency), 'INPUT_CURRENCY')
  invariant(a.outputAmount.currency.equals(b.outputAmount.currency), 'OUTPUT_CURRENCY')

  if (a.outputAmount.equalTo(b.outputAmount)) {
    if (a.inputAmount.equalTo(b.inputAmount)) {
      // consider the number of hops since each hop costs gas
      const aHops = a.swaps.reduce((total, cur) => total + cur.route.tokenPath.length, 0)
      const bHops = b.swaps.reduce((total, cur) => total + cur.route.tokenPath.length, 0)
      return aHops - bHops
    }
    // trade A requires less input than trade B, so A should come first
    if (a.inputAmount.lessThan(b.inputAmount)) {
      return -1
    } else {
      return 1
    }
  } else {
    // tradeA has less output than trade B, so should come second
    if (a.outputAmount.lessThan(b.outputAmount)) {
      return 1
    } else {
      return -1
    }
  }
}
