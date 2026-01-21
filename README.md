# ETCswap SDKs

TypeScript SDKs for building applications on ETCswap, the decentralized exchange on Ethereum Classic.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [@etcswapv2/sdk-core](./sdks/sdk-core) | [![npm](https://img.shields.io/npm/v/@etcswapv2/sdk-core)](https://www.npmjs.com/package/@etcswapv2/sdk-core) | Core types, tokens, and utilities |
| [@etcswapv2/sdk](./sdks/v2-sdk) | [![npm](https://img.shields.io/npm/v/@etcswapv2/sdk)](https://www.npmjs.com/package/@etcswapv2/sdk) | V2 AMM SDK (Pair, Route, Trade) |
| [@etcswapv3/sdk](./sdks/v3-sdk) | [![npm](https://img.shields.io/npm/v/@etcswapv3/sdk)](https://www.npmjs.com/package/@etcswapv3/sdk) | V3 CLMM SDK (Pool, Position) |
| [@etcswapv3/router-sdk](./sdks/router-sdk) | [![npm](https://img.shields.io/npm/v/@etcswapv3/router-sdk)](https://www.npmjs.com/package/@etcswapv3/router-sdk) | Universal Router SDK |

## Supported Chains

| Chain | Chain ID | Native Currency | RPC URL | Block Explorer |
|-------|----------|-----------------|---------|----------------|
| Ethereum Classic | 61 | ETC | https://etc.rivet.link | https://etc.blockscout.com |
| Mordor Testnet | 63 | METC | https://rpc.mordor.etccooperative.org | https://etc-mordor.blockscout.com |

## Installation

```bash
# Using npm
npm install @etcswapv2/sdk-core @etcswapv2/sdk @etcswapv3/sdk @etcswapv3/router-sdk

# Using pnpm
pnpm add @etcswapv2/sdk-core @etcswapv2/sdk @etcswapv3/sdk @etcswapv3/router-sdk

# Using yarn
yarn add @etcswapv2/sdk-core @etcswapv2/sdk @etcswapv3/sdk @etcswapv3/router-sdk
```

### Package Dependencies

```
# V2 only
npm install @etcswapv2/sdk-core @etcswapv2/sdk

# V3 only
npm install @etcswapv2/sdk-core @etcswapv3/sdk

# Universal Router (V2 + V3)
npm install @etcswapv2/sdk-core @etcswapv2/sdk @etcswapv3/sdk @etcswapv3/router-sdk
```

---

## Quick Start

### Creating Tokens

```typescript
import { ChainId, Token, WETC, ETC } from '@etcswapv2/sdk-core'

// Use built-in WETC token
const wetc = WETC[ChainId.CLASSIC]

// Create custom tokens
const USC = new Token(
  ChainId.CLASSIC,
  '0xDE093684c796204224BC081f937aa059D903c52a',
  6,
  'USC',
  'Classic USD Stablecoin'
)

// Native ETC (for wrapping/unwrapping)
const etc = ETC.onChain(ChainId.CLASSIC)
```

### V2 AMM Trading

```typescript
import { ChainId, Token, CurrencyAmount, TradeType, Percent } from '@etcswapv2/sdk-core'
import { Pair, Route, Trade } from '@etcswapv2/sdk'
import { ethers } from 'ethers'

// Setup provider
const provider = new ethers.JsonRpcProvider('https://etc.rivet.link')

// Define tokens
const WETC = new Token(ChainId.CLASSIC, '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', 18, 'WETC')
const USC = new Token(ChainId.CLASSIC, '0xDE093684c796204224BC081f937aa059D903c52a', 6, 'USC')

// Create a pair from on-chain data
async function createPair() {
  const pairAddress = Pair.getAddress(WETC, USC)

  // Fetch reserves from the pair contract
  const pairContract = new ethers.Contract(pairAddress, [
    'function getReserves() view returns (uint112, uint112, uint32)',
    'function token0() view returns (address)',
  ], provider)

  const [reserve0, reserve1] = await pairContract.getReserves()
  const token0Address = await pairContract.token0()

  const [tokenA, tokenB] = token0Address.toLowerCase() === WETC.address.toLowerCase()
    ? [WETC, USC]
    : [USC, WETC]

  const [reserveA, reserveB] = token0Address.toLowerCase() === WETC.address.toLowerCase()
    ? [reserve0, reserve1]
    : [reserve1, reserve0]

  return new Pair(
    CurrencyAmount.fromRawAmount(tokenA, reserveA.toString()),
    CurrencyAmount.fromRawAmount(tokenB, reserveB.toString())
  )
}

// Execute a trade
async function getV2Trade() {
  const pair = await createPair()
  const route = new Route([pair], WETC, USC)

  // Trade 1 WETC for USC
  const amountIn = CurrencyAmount.fromRawAmount(WETC, '1000000000000000000') // 1 WETC
  const trade = Trade.exactIn(route, amountIn)

  console.log('Input:', trade.inputAmount.toSignificant(6), 'WETC')
  console.log('Output:', trade.outputAmount.toSignificant(6), 'USC')
  console.log('Execution Price:', trade.executionPrice.toSignificant(6), 'USC per WETC')
  console.log('Price Impact:', trade.priceImpact.toSignificant(2), '%')

  // Calculate minimum output with slippage
  const slippageTolerance = new Percent(50, 10000) // 0.5%
  const minOutput = trade.minimumAmountOut(slippageTolerance)
  console.log('Minimum Output:', minOutput.toSignificant(6), 'USC')

  return trade
}
```

### V3 Concentrated Liquidity

```typescript
import { ChainId, Token, CurrencyAmount } from '@etcswapv2/sdk-core'
import { Pool, Position, FeeAmount, nearestUsableTick, TickMath } from '@etcswapv3/sdk'
import { ethers } from 'ethers'
import JSBI from 'jsbi'

const provider = new ethers.JsonRpcProvider('https://etc.rivet.link')

// V3 Pool Contract ABI (partial)
const POOL_ABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() view returns (uint128)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
]

// Fetch V3 pool data
async function getV3Pool(tokenA: Token, tokenB: Token, fee: FeeAmount): Promise<Pool> {
  // Compute pool address using CREATE2
  const poolAddress = Pool.getAddress(tokenA, tokenB, fee)

  const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider)

  const [slot0, liquidity] = await Promise.all([
    poolContract.slot0(),
    poolContract.liquidity(),
  ])

  return new Pool(
    tokenA,
    tokenB,
    fee,
    slot0.sqrtPriceX96.toString(),
    liquidity.toString(),
    Number(slot0.tick)
  )
}

// Create a liquidity position
async function createPosition() {
  const WETC = new Token(ChainId.CLASSIC, '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', 18, 'WETC')
  const USC = new Token(ChainId.CLASSIC, '0xDE093684c796204224BC081f937aa059D903c52a', 6, 'USC')

  const pool = await getV3Pool(WETC, USC, FeeAmount.MEDIUM)

  // Create position at +/- 10% from current price
  const tickSpacing = pool.tickSpacing
  const tickLower = nearestUsableTick(pool.tickCurrent - 1000, tickSpacing)
  const tickUpper = nearestUsableTick(pool.tickCurrent + 1000, tickSpacing)

  // Position with 1 WETC worth of liquidity
  const position = Position.fromAmounts({
    pool,
    tickLower,
    tickUpper,
    amount0: '1000000000000000000', // 1 WETC
    amount1: '1000000', // 1 USC
    useFullPrecision: true,
  })

  console.log('Liquidity:', position.liquidity.toString())
  console.log('Amount0:', position.amount0.toSignificant(6))
  console.log('Amount1:', position.amount1.toSignificant(6))

  return position
}
```

### Universal Router (Mixed V2/V3 Routes)

```typescript
import { ChainId, Token, CurrencyAmount, TradeType, Percent } from '@etcswapv2/sdk-core'
import { Pair, Route as V2Route } from '@etcswapv2/sdk'
import { Pool, Route as V3Route, FeeAmount } from '@etcswapv3/sdk'
import { MixedRouteSDK, Trade as RouterTrade, Protocol } from '@etcswapv3/router-sdk'

// Create a mixed route trade (V2 + V3)
async function getMixedRouteTrade() {
  const WETC = new Token(ChainId.CLASSIC, '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', 18, 'WETC')
  const USC = new Token(ChainId.CLASSIC, '0xDE093684c796204224BC081f937aa059D903c52a', 6, 'USC')
  const INTERMEDIATE = new Token(ChainId.CLASSIC, '0x...', 18, 'INT', 'Intermediate')

  // Fetch pools/pairs
  const v2Pair = await createPair(WETC, INTERMEDIATE)  // V2 pair
  const v3Pool = await getV3Pool(INTERMEDIATE, USC, FeeAmount.MEDIUM)  // V3 pool

  // Create mixed route: WETC -> (V2) -> INTERMEDIATE -> (V3) -> USC
  const mixedRoute = new MixedRouteSDK([v2Pair, v3Pool], WETC, USC)

  const amountIn = CurrencyAmount.fromRawAmount(WETC, '1000000000000000000')

  const trade = RouterTrade.createUncheckedTrade({
    route: mixedRoute,
    inputAmount: amountIn,
    outputAmount: CurrencyAmount.fromRawAmount(USC, '0'), // Will be calculated
    tradeType: TradeType.EXACT_INPUT,
  })

  return trade
}
```

---

## Contract Addresses

### Ethereum Classic (Chain ID: 61)

| Contract | Address |
|----------|---------|
| WETC | `0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a` |
| USC Stablecoin | `0xDE093684c796204224BC081f937aa059D903c52a` |
| **V2 Contracts** | |
| V2 Factory | `0x0307cd3D7DA98A29e6Ed0D2137be386Ec1e4Bc9C` |
| V2 Router | `0x79Bf07555C34e68C4Ae93642d1007D7f908d60F5` |
| V2 Multicall | `0xB945786D5dB40E79F1c25D937cCAC57ab3718BA1` |
| V2 INIT_CODE_HASH | `0xb5e58237f3a44220ffc3dfb989e53735df8fcd9df82c94b13105be8380344e52` |
| **V3 Contracts** | |
| V3 Factory | `0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC` |
| V3 SwapRouter02 | `0xEd88EDD995b00956097bF90d39C9341BBde324d1` |
| V3 Quoter V2 | `0x4d8c163400CB87Cbe1bae76dBf36A09FED85d39B` |
| V3 Position Manager | `0x3CEDe6562D6626A04d7502CC35720901999AB699` |
| V3 Multicall | `0x1E4282069e4822D5E6Fb88B2DbDE014f3E0625a9` |
| V3 Tick Lens | `0x23B7Bab45c84fA8f68f813D844E8afD44eE8C315` |
| V3 POOL_INIT_CODE_HASH | `0x7ea2da342810af3c5a9b47258f990aaac829fe1385a1398feb77d0126a85dbef` |
| **Universal Router** | |
| Universal Router | `0x9b676E761040D60C6939dcf5f582c2A4B51025F1` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

### Mordor Testnet (Chain ID: 63)

| Contract | Address |
|----------|---------|
| WETC | `0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a` |
| USC Stablecoin | `0xDE093684c796204224BC081f937aa059D903c52a` |
| **V2 Contracts** | |
| V2 Factory | `0x212eE1B5c8C26ff5B2c4c14CD1C54486Fe23ce70` |
| V2 Router | `0x582A87594c86b204920f9e337537b5Aa1fefC07C` |
| V2 Multicall | `0x41Fa0143ea4b4d91B41BF23d0A03ed3172725C4B` |
| V2 INIT_CODE_HASH | `0x4d8a51f257ed377a6ac3f829cd4226c892edbbbcb87622bcc232807b885b1303` |
| **V3 Contracts** | |
| V3 Factory | `0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC` |
| V3 SwapRouter02 | `0xEd88EDD995b00956097bF90d39C9341BBde324d1` |
| V3 Quoter V2 | `0x4d8c163400CB87Cbe1bae76dBf36A09FED85d39B` |
| V3 Position Manager | `0x3CEDe6562D6626A04d7502CC35720901999AB699` |
| V3 Multicall | `0x1E4282069e4822D5E6Fb88B2DbDE014f3E0625a9` |
| V3 Tick Lens | `0x23B7Bab45c84fA8f68f813D844E8afD44eE8C315` |
| V3 POOL_INIT_CODE_HASH | `0x7ea2da342810af3c5a9b47258f990aaac829fe1385a1398feb77d0126a85dbef` |
| **Universal Router** | |
| Universal Router | `0x9b676E761040D60C6939dcf5f582c2A4B51025F1` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

> **Note:** V2 contracts differ between Classic and Mordor. V3 contracts are the same on both networks.

---

## API Reference

### @etcswapv2/sdk-core

Core building blocks shared across all SDKs.

```typescript
// Chains
export enum ChainId {
  CLASSIC = 61,
  MORDOR = 63,
}

// Token types
export class Token { ... }
export class NativeCurrency { ... }
export const ETC: { onChain(chainId: ChainId): NativeCurrency }
export const WETC: { [chainId in ChainId]: Token }

// Currency amounts and math
export class CurrencyAmount<T extends Currency> { ... }
export class Fraction { ... }
export class Percent extends Fraction { ... }
export class Price<TBase, TQuote> { ... }

// Trade types
export enum TradeType {
  EXACT_INPUT = 0,
  EXACT_OUTPUT = 1,
}

// Contract addresses
export const WETC_ADDRESS: { [chainId in ChainId]: string }
export const USC_ADDRESS: { [chainId in ChainId]: string }
export const V2_FACTORY_ADDRESS: { [chainId in ChainId]: string }
export const V2_ROUTER_ADDRESS: { [chainId in ChainId]: string }
export const V3_FACTORY_ADDRESS: { [chainId in ChainId]: string }
export const V3_SWAP_ROUTER_ADDRESS: { [chainId in ChainId]: string }
export const UNIVERSAL_ROUTER_ADDRESS: { [chainId in ChainId]: string }
// ... and more
```

### @etcswapv2/sdk

V2 AMM (constant product formula) SDK.

```typescript
// Pair
export class Pair {
  static getAddress(tokenA: Token, tokenB: Token): string
  get token0(): Token
  get token1(): Token
  get reserve0(): CurrencyAmount<Token>
  get reserve1(): CurrencyAmount<Token>
  getOutputAmount(inputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pair]
  getInputAmount(outputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pair]
  getLiquidityMinted(...): CurrencyAmount<Token>
  getLiquidityValue(...): CurrencyAmount<Token>
}

// Route
export class Route<TInput extends Currency, TOutput extends Currency> {
  constructor(pairs: Pair[], input: TInput, output: TOutput)
  get path(): Token[]
  get midPrice(): Price<TInput, TOutput>
}

// Trade
export class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  static exactIn(route: Route, amountIn: CurrencyAmount): Trade
  static exactOut(route: Route, amountOut: CurrencyAmount): Trade
  get inputAmount(): CurrencyAmount<TInput>
  get outputAmount(): CurrencyAmount<TOutput>
  get executionPrice(): Price<TInput, TOutput>
  get priceImpact(): Percent
  minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<TOutput>
  maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<TInput>
}

// Constants
export const FACTORY_ADDRESS: string
export const FACTORY_ADDRESS_MAP: { [chainId: number]: string }
export const INIT_CODE_HASH: string
export const INIT_CODE_HASH_MAP: { [chainId: number]: string }
```

### @etcswapv3/sdk

V3 Concentrated Liquidity Market Maker SDK.

```typescript
// Pool
export class Pool {
  static getAddress(tokenA: Token, tokenB: Token, fee: FeeAmount): string
  constructor(tokenA: Token, tokenB: Token, fee: FeeAmount, sqrtRatioX96: BigintIsh, liquidity: BigintIsh, tickCurrent: number)
  get token0(): Token
  get token1(): Token
  get fee(): FeeAmount
  get tickSpacing(): number
  get sqrtRatioX96(): JSBI
  get liquidity(): JSBI
  get tickCurrent(): number
  get token0Price(): Price<Token, Token>
  get token1Price(): Price<Token, Token>
  getOutputAmount(inputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pool]
  getInputAmount(outputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pool]
}

// Position
export class Position {
  static fromAmounts(options: { pool: Pool, tickLower: number, tickUpper: number, amount0: BigintIsh, amount1: BigintIsh, useFullPrecision: boolean }): Position
  static fromAmount0(options: { pool: Pool, tickLower: number, tickUpper: number, amount0: BigintIsh, useFullPrecision: boolean }): Position
  static fromAmount1(options: { pool: Pool, tickLower: number, tickUpper: number, amount1: BigintIsh }): Position
  get pool(): Pool
  get tickLower(): number
  get tickUpper(): number
  get liquidity(): JSBI
  get amount0(): CurrencyAmount<Token>
  get amount1(): CurrencyAmount<Token>
  get mintAmounts(): { amount0: JSBI, amount1: JSBI }
}

// Fee tiers
export enum FeeAmount {
  LOWEST = 100,   // 0.01%
  LOW = 500,      // 0.05%
  MEDIUM = 3000,  // 0.30%
  HIGH = 10000,   // 1.00%
}

// Utilities
export function nearestUsableTick(tick: number, tickSpacing: number): number
export namespace TickMath {
  function getSqrtRatioAtTick(tick: number): JSBI
  function getTickAtSqrtRatio(sqrtRatioX96: JSBI): number
}
export namespace SqrtPriceMath { ... }
export namespace FullMath { ... }
```

### @etcswapv3/router-sdk

Universal Router SDK for cross-protocol routing.

```typescript
// Mixed routes (V2 + V3)
export class MixedRouteSDK<TInput extends Currency, TOutput extends Currency> {
  constructor(pools: (Pair | Pool)[], input: TInput, output: TOutput)
  get pools(): (Pair | Pool)[]
  get path(): Token[]
  get input(): TInput
  get output(): TOutput
}

// Universal trade
export class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  static createUncheckedTrade(options: {
    route: MixedRouteSDK<TInput, TOutput>
    inputAmount: CurrencyAmount<TInput>
    outputAmount: CurrencyAmount<TOutput>
    tradeType: TTradeType
  }): Trade<TInput, TOutput, TTradeType>
}

// Protocol identifiers
export enum Protocol {
  V2 = 'V2',
  V3 = 'V3',
  MIXED = 'MIXED',
}

// Constants
export const UNIVERSAL_ROUTER_ADDRESS: string
export const SWAP_ROUTER_02_ADDRESS: string
export const PERMIT2_ADDRESS: string
```

---

## Development

```bash
# Clone the repository
git clone https://github.com/etcswap/sdks.git
cd sdks

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

### Project Structure

```
sdks/
├── sdk-core/       # @etcswapv2/sdk-core - Core types and utilities
├── v2-sdk/         # @etcswapv2/sdk - V2 AMM SDK
├── v3-sdk/         # @etcswapv3/sdk - V3 CLMM SDK
└── router-sdk/     # @etcswapv3/router-sdk - Universal Router SDK
```

---

## Resources

- **ETCswap V2**: https://v2.etcswap.org
- **ETCswap V3**: https://v3.etcswap.org
- **V2 Analytics**: https://v2-info.etcswap.org
- **V3 Analytics**: https://v3-info.etcswap.org
- **Ethereum Classic**: https://ethereumclassic.org
- **Documentation**: https://docs.etcswap.org

## License

MIT
