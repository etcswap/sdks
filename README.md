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

| Chain | Chain ID | Native Currency |
|-------|----------|-----------------|
| Ethereum Classic | 61 | ETC |
| Mordor Testnet | 63 | METC |

## Installation

```bash
# V2 SDK (AMM)
pnpm add @etcswapv2/sdk-core @etcswapv2/sdk

# V3 SDK (CLMM)
pnpm add @etcswapv2/sdk-core @etcswapv3/sdk

# Universal Router
pnpm add @etcswapv2/sdk-core @etcswapv3/sdk @etcswapv3/router-sdk
```

## Quick Start

```typescript
import { ChainId, Token, CurrencyAmount } from '@etcswapv2/sdk-core'
import { Pair, Route, Trade } from '@etcswapv2/sdk'

// Create tokens
const WETC = new Token(ChainId.CLASSIC, '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', 18, 'WETC', 'Wrapped ETC')
const USC = new Token(ChainId.CLASSIC, '0xDE093684c796204224BC081f937aa059D903c52a', 6, 'USC', 'USD Coin')

// Fetch pair data and create trade
const pair = await Pair.fetchData(WETC, USC, provider)
const route = new Route([pair], WETC, USC)
const trade = Trade.exactIn(route, CurrencyAmount.fromRawAmount(WETC, '1000000000000000000'))

console.log('Execution Price:', trade.executionPrice.toSignificant(6))
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Architecture

These SDKs are designed to work together with consistent type definitions:

```
@etcswapv2/sdk-core     <- Foundation (Token, CurrencyAmount, etc.)
       |
@etcswapv2/sdk          <- V2 AMM (Pair, Trade)
       |
@etcswapv3/sdk          <- V3 CLMM (Pool, Position)
       |
@etcswapv3/router-sdk   <- Universal Router (cross-protocol routing)
```

## Related Resources

- [ETCswap V2](https://v2.etcswap.org)
- [ETCswap V3](https://v3.etcswap.org)
- [Ethereum Classic](https://ethereumclassic.org)

## License

MIT
