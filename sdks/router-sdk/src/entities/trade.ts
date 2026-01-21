import { Currency, CurrencyAmount, Fraction, Percent, Price, TradeType } from '@etcswapv2/sdk-core'
import { Route as V2Route, Trade as V2Trade } from '@etcswapv2/sdk'
import { Route as V3Route, Trade as V3Trade } from '@etcswapv3/sdk'
import invariant from 'tiny-invariant'

import { ONE, ZERO } from '../utils/constants'
import { MixedRouteSDK } from './mixedRouteSDK'
import { Protocol } from '../constants'

/**
 * A route wrapper for different protocol routes
 */
export interface RouteWrapper<TInput extends Currency, TOutput extends Currency> {
  protocol: Protocol
  route: V2Route<TInput, TOutput> | V3Route<TInput, TOutput> | MixedRouteSDK<TInput, TOutput>
  inputAmount: CurrencyAmount<TInput>
  outputAmount: CurrencyAmount<TOutput>
}

/**
 * Represents a trade with potentially multiple routes across multiple protocols
 */
export class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  /**
   * The routes of the trade
   */
  public readonly routes: RouteWrapper<TInput, TOutput>[]

  /**
   * The type of the trade
   */
  public readonly tradeType: TTradeType

  private _inputAmount: CurrencyAmount<TInput> | undefined
  private _outputAmount: CurrencyAmount<TOutput> | undefined

  /**
   * Constructs a new trade
   */
  public constructor({ routes, tradeType }: { routes: RouteWrapper<TInput, TOutput>[]; tradeType: TTradeType }) {
    this.routes = routes
    this.tradeType = tradeType
  }

  /**
   * The input amount for the trade
   */
  public get inputAmount(): CurrencyAmount<TInput> {
    if (this._inputAmount) {
      return this._inputAmount
    }

    const inputCurrency = this.routes[0].inputAmount.currency
    const totalInputFromRoutes = this.routes
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

    const outputCurrency = this.routes[0].outputAmount.currency
    const totalOutputFromRoutes = this.routes
      .map(({ outputAmount }) => outputAmount)
      .reduce((total, cur) => total.add(cur), CurrencyAmount.fromRawAmount(outputCurrency, 0))

    this._outputAmount = totalOutputFromRoutes
    return this._outputAmount
  }

  /**
   * The price expressed in terms of output amount/input amount
   */
  public get executionPrice(): Price<TInput, TOutput> {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.quotient,
      this.outputAmount.quotient
    )
  }

  /**
   * Returns the percent difference between the route's mid price and the price impact
   */
  public get priceImpact(): Percent {
    let spotOutputAmount = CurrencyAmount.fromRawAmount(this.outputAmount.currency, 0)
    for (const { route, inputAmount } of this.routes) {
      const midPrice = route.midPrice
      spotOutputAmount = spotOutputAmount.add(midPrice.quote(inputAmount))
    }

    const priceImpact = spotOutputAmount.subtract(this.outputAmount).divide(spotOutputAmount)
    return new Percent(priceImpact.numerator, priceImpact.denominator)
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
   * Creates a trade from V2 trade
   */
  public static fromV2Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
    v2Trade: V2Trade<TInput, TOutput, TTradeType>
  ): Trade<TInput, TOutput, TTradeType> {
    return new Trade({
      routes: [
        {
          protocol: Protocol.V2,
          route: v2Trade.route,
          inputAmount: v2Trade.inputAmount,
          outputAmount: v2Trade.outputAmount,
        },
      ],
      tradeType: v2Trade.tradeType,
    })
  }

  /**
   * Creates a trade from V3 trade
   */
  public static fromV3Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
    v3Trade: V3Trade<TInput, TOutput, TTradeType>
  ): Trade<TInput, TOutput, TTradeType> {
    const routes: RouteWrapper<TInput, TOutput>[] = v3Trade.swaps.map((swap) => ({
      protocol: Protocol.V3,
      route: swap.route,
      inputAmount: swap.inputAmount,
      outputAmount: swap.outputAmount,
    }))

    return new Trade({
      routes,
      tradeType: v3Trade.tradeType,
    })
  }

  /**
   * Creates a trade from multiple trades
   */
  public static fromTrades<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
    trades: (V2Trade<TInput, TOutput, TTradeType> | V3Trade<TInput, TOutput, TTradeType>)[],
    tradeType: TTradeType
  ): Trade<TInput, TOutput, TTradeType> {
    const routes: RouteWrapper<TInput, TOutput>[] = []

    for (const trade of trades) {
      if (trade instanceof V2Trade) {
        routes.push({
          protocol: Protocol.V2,
          route: trade.route,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })
      } else {
        for (const swap of trade.swaps) {
          routes.push({
            protocol: Protocol.V3,
            route: swap.route,
            inputAmount: swap.inputAmount,
            outputAmount: swap.outputAmount,
          })
        }
      }
    }

    return new Trade({ routes, tradeType })
  }
}
