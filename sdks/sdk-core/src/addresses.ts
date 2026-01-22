import { ChainId } from './chains'

/**
 * WETC (Wrapped ETC) addresses
 * Note: Same address on both Classic and Mordor
 */
export const WETC_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a',
  [ChainId.MORDOR]: '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a',
}

/**
 * Classic USD Stablecoin (USC) addresses
 * Note: Same address on both Classic and Mordor
 */
export const USC_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0xDE093684c796204224BC081f937aa059D903c52a',
  [ChainId.MORDOR]: '0xDE093684c796204224BC081f937aa059D903c52a',
}

/**
 * V2 Factory addresses
 */
export const V2_FACTORY_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x0307cd3D7DA98A29e6Ed0D2137be386Ec1e4Bc9C',
  [ChainId.MORDOR]: '0x212eE1B5c8C26ff5B2c4c14CD1C54486Fe23ce70',
}

/**
 * V2 Router addresses
 */
export const V2_ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x79Bf07555C34e68C4Ae93642d1007D7f908d60F5',
  [ChainId.MORDOR]: '0x6d194227a9A1C11f144B35F96E6289c5602Da493',
}

/**
 * V2 Multicall addresses
 */
export const V2_MULTICALL_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x900cD941a2451471BC5760c3d69493Ac57aA9698',
  [ChainId.MORDOR]: '0x41Fa0143ea4b4d91B41BF23d0A03ed3172725C4B',
}

/**
 * V3 Factory addresses
 * Note: Same address on both Classic and Mordor
 */
export const V3_FACTORY_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC',
  [ChainId.MORDOR]: '0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC',
}

/**
 * V3 Position Manager (NFT) addresses
 * Note: Same address on both Classic and Mordor
 */
export const V3_POSITION_MANAGER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x3CEDe6562D6626A04d7502CC35720901999AB699',
  [ChainId.MORDOR]: '0x3CEDe6562D6626A04d7502CC35720901999AB699',
}

/**
 * V3 Quoter V2 addresses
 * Note: Same address on both Classic and Mordor
 */
export const V3_QUOTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x4d8c163400CB87Cbe1bae76dBf36A09FED85d39B',
  [ChainId.MORDOR]: '0x4d8c163400CB87Cbe1bae76dBf36A09FED85d39B',
}

/**
 * V3 Swap Router 02 addresses
 * Note: Same address on both Classic and Mordor
 */
export const V3_SWAP_ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0xEd88EDD995b00956097bF90d39C9341BBde324d1',
  [ChainId.MORDOR]: '0xEd88EDD995b00956097bF90d39C9341BBde324d1',
}

/**
 * Universal Router addresses
 * Note: Same address on both Classic and Mordor
 */
export const UNIVERSAL_ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x9b676E761040D60C6939dcf5f582c2A4B51025F1',
  [ChainId.MORDOR]: '0x9b676E761040D60C6939dcf5f582c2A4B51025F1',
}

/**
 * Permit2 addresses
 * Note: Same address on both Classic and Mordor
 */
export const PERMIT2_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  [ChainId.MORDOR]: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
}

/**
 * V3 Multicall addresses
 * Note: Same address on both Classic and Mordor
 */
export const V3_MULTICALL_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x1E4282069e4822D5E6Fb88B2DbDE014f3E0625a9',
  [ChainId.MORDOR]: '0x1E4282069e4822D5E6Fb88B2DbDE014f3E0625a9',
}

/**
 * V3 Tick Lens addresses
 * Note: Same address on both Classic and Mordor
 */
export const V3_TICK_LENS_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.CLASSIC]: '0x23B7Bab45c84fA8f68f813D844E8afD44eE8C315',
  [ChainId.MORDOR]: '0x23B7Bab45c84fA8f68f813D844E8afD44eE8C315',
}
