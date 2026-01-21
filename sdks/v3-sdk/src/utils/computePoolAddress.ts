import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { defaultAbiCoder } from '@ethersproject/abi'
import { Token } from '@etcswapv2/sdk-core'
import { FeeAmount } from '../constants'

// ETCswap V3 Pool init code hash (same as Uniswap V3)
const POOL_INIT_CODE_HASH = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'

/**
 * Computes a V3 pool address from the factory, tokens, and fee
 * @param factoryAddress The ETCswap V3 factory address
 * @param tokenA The first token of the pair, irrespective of sort order
 * @param tokenB The second token of the pair, irrespective of sort order
 * @param fee The fee tier of the pool
 * @param initCodeHashManualOverride Override the init code hash used to compute the pool address if necessary
 * @returns The pool address
 */
export function computePoolAddress({
  factoryAddress,
  tokenA,
  tokenB,
  fee,
  initCodeHashManualOverride,
}: {
  factoryAddress: string
  tokenA: Token
  tokenB: Token
  fee: FeeAmount
  initCodeHashManualOverride?: string
}): string {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

  const salt = keccak256(
    ['bytes'],
    [defaultAbiCoder.encode(['address', 'address', 'uint24'], [token0.address, token1.address, fee])]
  )

  const initCodeHash = initCodeHashManualOverride ?? POOL_INIT_CODE_HASH

  return getCreate2Address(factoryAddress, salt, initCodeHash)
}
