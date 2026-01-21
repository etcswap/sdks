import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { MAX_TICK, MIN_TICK } from '../constants'

export interface TickConstructorArgs {
  index: number
  liquidityGross: JSBI
  liquidityNet: JSBI
}

/**
 * Represents a V3 tick
 */
export class Tick {
  public readonly index: number
  public readonly liquidityGross: JSBI
  public readonly liquidityNet: JSBI

  constructor({ index, liquidityGross, liquidityNet }: TickConstructorArgs) {
    invariant(index >= MIN_TICK && index <= MAX_TICK, 'TICK')
    this.index = index
    this.liquidityGross = liquidityGross
    this.liquidityNet = liquidityNet
  }
}
