import JSBI from 'jsbi'
import { Tick, TickConstructorArgs } from './tick'

/**
 * Provides information about ticks
 */
export interface TickDataProvider {
  /**
   * Return information corresponding to a specific tick
   * @param tick the tick to load
   */
  getTick(tick: number): Promise<{ liquidityNet: JSBI; liquidityGross: JSBI }>

  /**
   * Return the next tick that is initialized within a single word
   * @param tick The current tick
   * @param lte Whether the next tick should be lte the current tick
   * @param tickSpacing The tick spacing of the pool
   */
  nextInitializedTickWithinOneWord(tick: number, lte: boolean, tickSpacing: number): Promise<[number, boolean]>
}

/**
 * A data provider for ticks that is backed by an in-memory array of ticks
 */
export class TickListDataProvider implements TickDataProvider {
  private ticks: readonly Tick[]

  constructor(ticks: (Tick | TickConstructorArgs)[], tickSpacing: number) {
    const ticksMapped: Tick[] = ticks.map((t) => (t instanceof Tick ? t : new Tick(t)))
    TickListDataProvider.validateList(ticksMapped, tickSpacing)
    this.ticks = ticksMapped
  }

  private static validateList(ticks: Tick[], tickSpacing: number) {
    if (ticks.length === 0) return

    // ensure ticks are spaced appropriately
    for (let i = 0; i < ticks.length; i++) {
      if (ticks[i].index % tickSpacing !== 0) {
        throw new Error(`Tick at index ${i} is not a multiple of tick spacing ${tickSpacing}`)
      }
    }

    // ensure tick liquidity deltas sum to 0
    let liquiditySum = JSBI.BigInt(0)
    for (const tick of ticks) {
      liquiditySum = JSBI.add(liquiditySum, tick.liquidityNet)
    }
    if (!JSBI.equal(liquiditySum, JSBI.BigInt(0))) {
      throw new Error('Tick liquidity deltas must sum to zero')
    }
  }

  async getTick(tick: number): Promise<{ liquidityNet: JSBI; liquidityGross: JSBI }> {
    const t = this.ticks.find((t) => t.index === tick)
    if (!t) {
      throw new Error(`Tick ${tick} not found`)
    }
    return t
  }

  async nextInitializedTickWithinOneWord(
    tick: number,
    lte: boolean,
    tickSpacing: number
  ): Promise<[number, boolean]> {
    const compressed = Math.floor(tick / tickSpacing)

    if (lte) {
      const wordPos = compressed >> 8
      const minimum = (wordPos << 8) * tickSpacing

      // find the first tick less than or equal to tick
      for (let i = this.ticks.length - 1; i >= 0; i--) {
        if (this.ticks[i].index <= tick && this.ticks[i].index >= minimum) {
          return [this.ticks[i].index, true]
        }
      }
      return [minimum, false]
    } else {
      const wordPos = (compressed + 1) >> 8
      const maximum = ((wordPos + 1) << 8) * tickSpacing - 1

      // find the first tick greater than tick
      for (const t of this.ticks) {
        if (t.index > tick && t.index <= maximum) {
          return [t.index, true]
        }
      }
      return [maximum, false]
    }
  }
}

/**
 * A no-op tick data provider that throws an error when any method is called
 */
export const NO_TICK_DATA_PROVIDER_DEFAULT: TickDataProvider = {
  async getTick(_tick: number): Promise<{ liquidityNet: JSBI; liquidityGross: JSBI }> {
    throw new Error('No tick data provider was given')
  },
  async nextInitializedTickWithinOneWord(
    _tick: number,
    _lte: boolean,
    _tickSpacing: number
  ): Promise<[number, boolean]> {
    throw new Error('No tick data provider was given')
  },
}
