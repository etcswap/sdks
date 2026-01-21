import { ChainId } from './chains'

/**
 * WETC (Wrapped ETC) addresses
 */
export const WETC_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a',
  [ChainId.MORDOR]: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
}

/**
 * V2 Factory addresses
 */
export const V2_FACTORY_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  [ChainId.MORDOR]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
}

/**
 * V2 Router addresses
 */
export const V2_ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  [ChainId.MORDOR]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
}

/**
 * V3 Factory addresses
 */
export const V3_FACTORY_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [ChainId.MORDOR]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
}

/**
 * V3 Position Manager (NFT) addresses
 */
export const V3_POSITION_MANAGER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  [ChainId.MORDOR]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
}

/**
 * V3 Quoter V2 addresses
 */
export const V3_QUOTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  [ChainId.MORDOR]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
}

/**
 * Universal Router addresses
 */
export const UNIVERSAL_ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  [ChainId.MORDOR]: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
}
