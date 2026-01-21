import {
  Currency,
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  sortedInsert,
  Token,
  TradeType,
} from '@etcswapv2/sdk-core'
import invariant from 'tiny-invariant'

import { ONE, ZERO } from '../constants'
import { InsufficientInputAmountError } from '../errors'
import { Pair } from './pair'
import { Route } from './route'

/**
 * Returns the percent difference between the mid price and the execution price
 */
function computePriceImpact<TInput extends Currency, TOutput extends Currency>(
  midPrice: Price<TInput, TOutput>,
  inputAmount: CurrencyAmount<TInput>,
  outputAmount: CurrencyAmount<TOutput>
): Percent {
  const quotedOutputAmount = midPrice.quote(inputAmount)
  const priceImpact = quotedOutputAmount.subtract(outputAmount).divide(quotedOutputAmount)
  return new Percent(priceImpact.numerator, priceImpact.denominator)
}

/**
 * Represents a trade executed against a list of pairs
 */
export class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  /**
   * The route of the trade
   */
  public readonly route: Route<TInput, TOutput>

  /**
   * The type of the trade, either exact in or exact out
   */
  public readonly tradeType: TTradeType

  /**
   * The input amount for the trade
   */
  public readonly inputAmount: CurrencyAmount<TInput>

  /**
   * The output amount for the trade
   */
  public readonly outputAmount: CurrencyAmount<TOutput>

  /**
   * The price expressed in terms of output amount/input amount
   */
  public readonly executionPrice: Price<TInput, TOutput>

  /**
   * The percent difference between the mid price before the trade and the trade execution price
   */
  public readonly priceImpact: Percent

  /**
   * Constructs an exact in trade with the given amount in and route
   * @param route The route of the exact in trade
   * @param amountIn The amount being passed in
   */
  public static exactIn<TInput extends Currency, TOutput extends Currency>(
    route: Route<TInput, TOutput>,
    amountIn: CurrencyAmount<TInput>
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT> {
    return new Trade(route, amountIn, TradeType.EXACT_INPUT)
  }

  /**
   * Constructs an exact out trade with the given amount out and route
   * @param route The route of the exact out trade
   * @param amountOut The amount returned by the trade
   */
  public static exactOut<TInput extends Currency, TOutput extends Currency>(
    route: Route<TInput, TOutput>,
    amountOut: CurrencyAmount<TOutput>
  ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT> {
    return new Trade(route, amountOut, TradeType.EXACT_OUTPUT)
  }

  public constructor(
    route: Route<TInput, TOutput>,
    amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>,
    tradeType: TTradeType
  ) {
    this.route = route
    this.tradeType = tradeType

    const tokenAmounts: CurrencyAmount<Token>[] = new Array(route.path.length)

    if (tradeType === TradeType.EXACT_INPUT) {
      invariant(amount.currency.equals(route.input), 'INPUT')
      tokenAmounts[0] = amount.wrapped
      for (let i = 0; i < route.path.length - 1; i++) {
        const pair = route.pairs[i]
        const [outputAmount] = pair.getOutputAmount(tokenAmounts[i])
        tokenAmounts[i + 1] = outputAmount
      }
      this.inputAmount = CurrencyAmount.fromFractionalAmount(
        route.input,
        amount.numerator,
        amount.denominator
      ) as CurrencyAmount<TInput>
      this.outputAmount = CurrencyAmount.fromFractionalAmount(
        route.output,
        tokenAmounts[tokenAmounts.length - 1].numerator,
        tokenAmounts[tokenAmounts.length - 1].denominator
      ) as CurrencyAmount<TOutput>
    } else {
      invariant(amount.currency.equals(route.output), 'OUTPUT')
      tokenAmounts[tokenAmounts.length - 1] = amount.wrapped
      for (let i = route.path.length - 1; i > 0; i--) {
        const pair = route.pairs[i - 1]
        const [inputAmount] = pair.getInputAmount(tokenAmounts[i])
        tokenAmounts[i - 1] = inputAmount
      }
      this.inputAmount = CurrencyAmount.fromFractionalAmount(
        route.input,
        tokenAmounts[0].numerator,
        tokenAmounts[0].denominator
      ) as CurrencyAmount<TInput>
      this.outputAmount = CurrencyAmount.fromFractionalAmount(
        route.output,
        amount.numerator,
        amount.denominator
      ) as CurrencyAmount<TOutput>
    }

    this.executionPrice = new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.quotient,
      this.outputAmount.quotient
    )

    this.priceImpact = computePriceImpact(route.midPrice, this.inputAmount, this.outputAmount)
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
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
   * Given a list of pairs, and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
   * amount to an output token, making at most `maxHops` hops.
   * @param pairs the pairs to consider
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops to make
   * @param currentPairs used in recursion
   * @param originalAmountIn used in recursion
   * @param bestTrades used in recursion
   */
  public static bestTradeExactIn<TInput extends Currency, TOutput extends Currency>(
    pairs: Pair[],
    currencyAmountIn: CurrencyAmount<TInput>,
    currencyOut: TOutput,
    { maxNumResults = 3, maxHops = 3 }: { maxNumResults?: number; maxHops?: number } = {},
    currentPairs: Pair[] = [],
    nextAmountIn: CurrencyAmount<Currency> = currencyAmountIn,
    bestTrades: Trade<TInput, TOutput, TradeType.EXACT_INPUT>[] = []
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT>[] {
    invariant(pairs.length > 0, 'PAIRS')
    invariant(maxHops > 0, 'MAX_HOPS')
    invariant(currencyAmountIn === nextAmountIn || currentPairs.length > 0, 'INVALID_RECURSION')

    const amountIn = nextAmountIn.wrapped
    const tokenOut = currencyOut.wrapped

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      if (!pair.token0.equals(amountIn.currency) && !pair.token1.equals(amountIn.currency)) continue
      if (pair.reserve0.equalTo(ZERO) || pair.reserve1.equalTo(ZERO)) continue

      let amountOut: CurrencyAmount<Token>
      try {
        ;[amountOut] = pair.getOutputAmount(amountIn)
      } catch (error) {
        if (error instanceof InsufficientInputAmountError) {
          continue
        }
        throw error
      }

      if (amountOut.currency.equals(tokenOut)) {
        sortedInsert(
          bestTrades,
          new Trade(
            new Route([...currentPairs, pair], currencyAmountIn.currency, currencyOut),
            currencyAmountIn,
            TradeType.EXACT_INPUT
          ),
          maxNumResults,
          tradeComparator
        )
      } else if (maxHops > 1 && pairs.length > 1) {
        const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length))
        Trade.bestTradeExactIn(
          pairsExcludingThisPair,
          currencyAmountIn,
          currencyOut,
          {
            maxNumResults,
            maxHops: maxHops - 1,
          },
          [...currentPairs, pair],
          amountOut,
          bestTrades
        )
      }
    }

    return bestTrades
  }

  /**
   * Given a list of pairs, and a fixed amount out, returns the top `maxNumResults` trades that go from an input token
   * to an output token amount, making at most `maxHops` hops.
   * @param pairs the pairs to consider
   * @param currencyIn the currency to spend
   * @param currencyAmountOut the desired currency amount out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops to make
   * @param currentPairs used in recursion
   * @param originalAmountOut used in recursion
   * @param bestTrades used in recursion
   */
  public static bestTradeExactOut<TInput extends Currency, TOutput extends Currency>(
    pairs: Pair[],
    currencyIn: TInput,
    currencyAmountOut: CurrencyAmount<TOutput>,
    { maxNumResults = 3, maxHops = 3 }: { maxNumResults?: number; maxHops?: number } = {},
    currentPairs: Pair[] = [],
    nextAmountOut: CurrencyAmount<Currency> = currencyAmountOut,
    bestTrades: Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[] = []
  ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[] {
    invariant(pairs.length > 0, 'PAIRS')
    invariant(maxHops > 0, 'MAX_HOPS')
    invariant(currencyAmountOut === nextAmountOut || currentPairs.length > 0, 'INVALID_RECURSION')

    const amountOut = nextAmountOut.wrapped
    const tokenIn = currencyIn.wrapped

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      if (!pair.token0.equals(amountOut.currency) && !pair.token1.equals(amountOut.currency)) continue
      if (pair.reserve0.equalTo(ZERO) || pair.reserve1.equalTo(ZERO)) continue

      let amountIn: CurrencyAmount<Token>
      try {
        ;[amountIn] = pair.getInputAmount(amountOut)
      } catch (error) {
        if (error instanceof InsufficientInputAmountError) {
          continue
        }
        throw error
      }

      if (amountIn.currency.equals(tokenIn)) {
        sortedInsert(
          bestTrades,
          new Trade(
            new Route([pair, ...currentPairs], currencyIn, currencyAmountOut.currency),
            currencyAmountOut,
            TradeType.EXACT_OUTPUT
          ),
          maxNumResults,
          tradeComparator
        )
      } else if (maxHops > 1 && pairs.length > 1) {
        const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length))
        Trade.bestTradeExactOut(
          pairsExcludingThisPair,
          currencyIn,
          currencyAmountOut,
          {
            maxNumResults,
            maxHops: maxHops - 1,
          },
          [pair, ...currentPairs],
          amountIn,
          bestTrades
        )
      }
    }

    return bestTrades
  }
}

/**
 * Comparator function to sort trades by their output amounts
 */
export function tradeComparator<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
  a: Trade<TInput, TOutput, TTradeType>,
  b: Trade<TInput, TOutput, TTradeType>
): number {
  if (a.tradeType !== b.tradeType) {
    throw new Error('Cannot compare trades of different types')
  }

  if (a.outputAmount.currency !== b.outputAmount.currency) {
    throw new Error('Cannot compare trades with different output currencies')
  }
  if (a.inputAmount.currency !== b.inputAmount.currency) {
    throw new Error('Cannot compare trades with different input currencies')
  }

  const ioComp = inputOutputComparator(a, b)
  if (ioComp !== 0) {
    return ioComp
  }

  // consider the number of hops
  return a.route.path.length - b.route.path.length
}

/**
 * Compares two trades by their input/output amounts
 */
export function inputOutputComparator<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
  a: Trade<TInput, TOutput, TTradeType>,
  b: Trade<TInput, TOutput, TTradeType>
): number {
  if (a.tradeType === TradeType.EXACT_INPUT) {
    // for exact input, prefer larger output
    const outputDiff = a.outputAmount.subtract(b.outputAmount)
    if (outputDiff.greaterThan(ZERO)) {
      return -1
    } else if (outputDiff.lessThan(ZERO)) {
      return 1
    }
    return 0
  } else {
    // for exact output, prefer smaller input
    const inputDiff = a.inputAmount.subtract(b.inputAmount)
    if (inputDiff.greaterThan(ZERO)) {
      return 1
    } else if (inputDiff.lessThan(ZERO)) {
      return -1
    }
    return 0
  }
}
