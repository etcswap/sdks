# ETCswap SDKs

TypeScript SDKs for building applications on ETCswap, the decentralized exchange on Ethereum Classic.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@etcswapv2/sdk-core](./sdks/sdk-core) | [![npm](https://img.shields.io/npm/v/@etcswapv2/sdk-core)](https://www.npmjs.com/package/@etcswapv2/sdk-core) | Core types, tokens, and utilities |
| [@etcswapv2/sdk](./sdks/v2-sdk) | [![npm](https://img.shields.io/npm/v/@etcswapv2/sdk)](https://www.npmjs.com/package/@etcswapv2/sdk) | V2 AMM SDK (Pair, Route, Trade) |
| [@etcswapv3/sdk](./sdks/v3-sdk) | [![npm](https://img.shields.io/npm/v/@etcswapv3/sdk)](https://www.npmjs.com/package/@etcswapv3/sdk) | V3 CLMM SDK (Pool, Position) |
| [@etcswapv3/router-sdk](./sdks/router-sdk) | [![npm](https://img.shields.io/npm/v/@etcswapv3/router-sdk)](https://www.npmjs.com/package/@etcswapv3/router-sdk) | Universal Router SDK |

**Future:** `@etcswapv4/sdk` - V4 Hooks-based AMM (see [V4 Roadmap](./docs/V4_ROADMAP.md))

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

```bash
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

// Define tokens
const WETC = new Token(ChainId.CLASSIC, '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', 18, 'WETC')
const USC = new Token(ChainId.CLASSIC, '0xDE093684c796204224BC081f937aa059D903c52a', 6, 'USC')

// Create pair from reserves (fetched from chain)
const pair = new Pair(
  CurrencyAmount.fromRawAmount(WETC, reserveWETC),
  CurrencyAmount.fromRawAmount(USC, reserveUSC)
)

// Create route and trade
const route = new Route([pair], WETC, USC)
const amountIn = CurrencyAmount.fromRawAmount(WETC, '1000000000000000000') // 1 WETC
const trade = new Trade(route, amountIn, TradeType.EXACT_INPUT)

console.log('Output:', trade.outputAmount.toSignificant(6), 'USC')
console.log('Price Impact:', trade.priceImpact.toSignificant(2), '%')

// Calculate minimum output with slippage
const slippage = new Percent(50, 10000) // 0.5%
const minOutput = trade.minimumAmountOut(slippage)
```

### V3 Concentrated Liquidity

```typescript
import { ChainId, Token, CurrencyAmount } from '@etcswapv2/sdk-core'
import { Pool, Position, FeeAmount, nearestUsableTick } from '@etcswapv3/sdk'

// Create pool from chain data
const pool = new Pool(
  tokenA,
  tokenB,
  FeeAmount.MEDIUM,    // 0.3% fee
  sqrtPriceX96,        // Current sqrt price
  liquidity,           // Total liquidity
  tick                 // Current tick
)

// Create position
const position = Position.fromAmounts({
  pool,
  tickLower: nearestUsableTick(pool.tickCurrent - 1000, pool.tickSpacing),
  tickUpper: nearestUsableTick(pool.tickCurrent + 1000, pool.tickSpacing),
  amount0: '1000000000000000000',
  amount1: '1000000',
  useFullPrecision: true,
})

console.log('Liquidity:', position.liquidity.toString())
```

---

## Contract Addresses

See [deployed-contracts.md](./deployed-contracts.md) for the complete list.

### Quick Reference (Ethereum Classic - Chain ID 61)

| Contract | Address |
|----------|---------|
| WETC | `0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a` |
| V2 Factory | `0x68627D042E048ade8B0a97E23B3d3D4Dae9eAE88` |
| V2 Router | `0x8aB76362CE6C56ACfea04c95e9E79e5e92381B6b` |
| V3 Factory | `0x73aa3b1534c8de08619a320f3cce0ea8e9bfe7c9` |
| V3 SwapRouter02 | `0xCa28ae72d988cBC22caE3ceb9eeB62687eb4e7f2` |
| Universal Router | `0xed7904F9360d2260d39A891DD756ff66d3deDdAF` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

### INIT_CODE_HASH Values

**Important:** ETCswap uses different INIT_CODE_HASH values than Uniswap:

| Type | Chain | Hash |
|------|-------|------|
| V2 Pair | Classic | `0xb5e58237f3a44220ffc3dfb989e53735df8fcd9df82c94b13105be8380344e52` |
| V2 Pair | Mordor | `0x4d8a51f257ed377a6ac3f829cd4226c892edbbbcb87622bcc232807b885b1303` |
| V3 Pool | All | `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54` |

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
├── .github/
│   ├── CLAUDE.md              # AI assistant instructions (Claude Code)
│   └── copilot-instructions.md # AI assistant instructions (GitHub Copilot)
├── docs/
│   ├── PUBLISHING.md          # npm publishing guide
│   └── V4_ROADMAP.md          # V4 SDK roadmap
├── sdks/
│   ├── sdk-core/              # @etcswapv2/sdk-core
│   ├── v2-sdk/                # @etcswapv2/sdk
│   ├── v3-sdk/                # @etcswapv3/sdk
│   └── router-sdk/            # @etcswapv3/router-sdk
├── deployed-contracts.md      # Contract addresses reference
├── CONTRIBUTING.md            # Contribution guidelines
└── README.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Contributing Guide](./CONTRIBUTING.md) | How to contribute to this project |
| [Publishing Guide](./docs/PUBLISHING.md) | How to publish packages to npm |
| [V4 Roadmap](./docs/V4_ROADMAP.md) | Future V4 SDK development plans |
| [Deployed Contracts](./deployed-contracts.md) | All contract addresses for Classic and Mordor |
| [Claude Instructions](./.github/CLAUDE.md) | Instructions for Claude Code AI assistant |
| [Copilot Instructions](./.github/copilot-instructions.md) | Instructions for GitHub Copilot |

---

## API Reference

### @etcswapv2/sdk-core

Core building blocks shared across all SDKs:

- `ChainId` - Supported chain identifiers (CLASSIC=61, MORDOR=63)
- `Token` - ERC20 token representation
- `CurrencyAmount` - Amount with currency context
- `Percent` - Percentage calculations
- `Price` - Price representation
- `TradeType` - EXACT_INPUT or EXACT_OUTPUT
- `ETC` - Native currency helper
- `WETC` - Wrapped ETC token addresses

### @etcswapv2/sdk

V2 AMM (constant product) entities:

- `Pair` - Liquidity pair representation
- `Route` - Path through pairs
- `Trade` - Swap trade with amounts and impact
- `computePairAddress` - Calculate pair address via CREATE2
- `INIT_CODE_HASH_MAP` - Chain-specific pair init code hashes

### @etcswapv3/sdk

V3 CLMM (concentrated liquidity) entities:

- `Pool` - V3 pool with tick data
- `Position` - Liquidity position in tick range
- `Route` - Path through pools
- `Trade` - V3 swap trade
- `FeeAmount` - Fee tier enum (100, 500, 3000, 10000)
- `computePoolAddress` - Calculate pool address via CREATE2
- `nearestUsableTick` - Round tick to valid value
- `TickMath` - Tick <-> sqrt price conversions
- `TICK_SPACINGS` - Fee tier to tick spacing mapping

### @etcswapv3/router-sdk

Universal Router support:

- `MixedRouteSDK` - Mixed V2/V3 routes
- `Trade` - Universal trade representation
- `Protocol` - V2, V3, or MIXED identifier

---

## For AI Coding Assistants

This repository includes instructions for AI coding assistants:

- **Claude Code**: See [.github/CLAUDE.md](./.github/CLAUDE.md)
- **GitHub Copilot**: See [.github/copilot-instructions.md](./.github/copilot-instructions.md)

Key points for AI assistants:
1. Use JSBI ^3.x (not 4.x) for big integer math
2. ETCswap INIT_CODE_HASH values differ from Uniswap
3. Chain IDs: Classic=61, Mordor=63
4. Follow existing code patterns in each SDK

---

## Resources

- **ETCswap V2**: https://v2.etcswap.org
- **ETCswap V3**: https://v3.etcswap.org
- **Analytics**: https://v3-info.etcswap.org
- **Ethereum Classic**: https://ethereumclassic.org

---

## License

MIT
