import { getAddress } from '@ethersproject/address'

/**
 * Validates an address and returns the parsed (checksummed) version of that address
 * @param address the unchecksummed hex address
 */
export function validateAndParseAddress(address: string): string {
  try {
    return getAddress(address)
  } catch {
    throw new Error(`${address} is not a valid address.`)
  }
}

/**
 * Checks if an address is valid without checksumming
 * @param address the address to check
 */
export function checkValidAddress(address: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`${address} is not a valid address.`)
  }
  return address
}
