import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { defaultAbiCoder } from '@ethersproject/abi'
import { Token } from '@etcswapv2/sdk-core'
import { FeeAmount } from '../constants'

// ETCswap V3 Pool init code hash
// Source of truth: https://github.com/etcswap/sdks/blob/main/deployed-contracts.md
const POOL_INIT_CODE_HASH = '0x7ea2da342810af3c5a9b47258f990aaac829fe1385a1398feb77d0126a85dbef'

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
