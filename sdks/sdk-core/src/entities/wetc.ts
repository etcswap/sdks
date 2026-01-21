import { ChainId } from '../chains'
import { WETC_ADDRESS } from '../addresses'
import { Token } from './token'

/**
 * Known WETC (Wrapped ETC) implementation addresses, used in our implementation of ETC#wrapped
 */
export const WETC: { [chainId in ChainId]: Token } = {
  [ChainId.CLASSIC]: new Token(ChainId.CLASSIC, WETC_ADDRESS[ChainId.CLASSIC], 18, 'WETC', 'Wrapped ETC'),
  [ChainId.MORDOR]: new Token(ChainId.MORDOR, WETC_ADDRESS[ChainId.MORDOR], 18, 'WETC', 'Wrapped ETC'),
}
