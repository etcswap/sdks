# GitHub Copilot Instructions for ETCswap SDKs

## Project Context

This is a TypeScript SDK monorepo for ETCswap, a DEX on Ethereum Classic. The code is adapted from Uniswap SDKs.

## Key Constraints

### Chain IDs
- Ethereum Classic: `61`
- Mordor Testnet: `63`

### Contract Addresses (CRITICAL)
**Always verify against `deployed-contracts.md` - the single source of truth**

V2 (DIFFERENT per network):
- Classic Factory: `0x0307cd3D7DA98A29e6Ed0D2137be386Ec1e4Bc9C`
- Mordor Factory: `0x212eE1B5c8C26ff5B2c4c14CD1C54486Fe23ce70`

V3 (SAME for both networks):
- Factory: `0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC`
- Universal Router: `0x9b676E761040D60C6939dcf5f582c2A4B51025F1`

### INIT_CODE_HASH (CRITICAL)
ETCswap uses DIFFERENT hashes than Uniswap:

V2:
- Classic: `0xb5e58237f3a44220ffc3dfb989e53735df8fcd9df82c94b13105be8380344e52`
- Mordor: `0x4d8a51f257ed377a6ac3f829cd4226c892edbbbcb87622bcc232807b885b1303`

V3:
- All chains: `0x7ea2da342810af3c5a9b47258f990aaac829fe1385a1398feb77d0126a85dbef`

### JSBI Version
Always use JSBI ^3.x, never 4.x (type incompatibility issues).

## Package Names

- `@etcswapv2/sdk-core` - Core types
- `@etcswapv2/sdk` - V2 AMM
- `@etcswapv3/sdk` - V3 CLMM
- `@etcswapv3/router-sdk` - Universal Router
- `@etcswapv4/sdk` - V4 (future)

## Code Patterns

### Creating Tokens
```typescript
import { ChainId, Token } from '@etcswapv2/sdk-core'

const token = new Token(
  ChainId.CLASSIC,
  '0x...',
  18,
  'SYMBOL',
  'Token Name'
)
```

### Using JSBI
```typescript
import JSBI from 'jsbi'

const amount = JSBI.BigInt('1000000000000000000')
const doubled = JSBI.multiply(amount, JSBI.BigInt(2))
```

### Address Computation
```typescript
// V2 Pair
import { computePairAddress } from '@etcswapv2/sdk'
const pairAddress = computePairAddress({
  factoryAddress,
  tokenA,
  tokenB,
  initCodeHash: INIT_CODE_HASH_MAP[chainId]
})

// V3 Pool
import { computePoolAddress } from '@etcswapv3/sdk'
const poolAddress = computePoolAddress({
  factoryAddress,
  tokenA,
  tokenB,
  fee,
  initCodeHashManualOverride: V3_INIT_CODE_HASH
})
```

## Avoid

- Native BigInt (use JSBI instead)
- Uniswap's default INIT_CODE_HASH values
- JSBI version 4.x
- Hardcoded addresses (use constants)

## Build Commands

```bash
pnpm install    # Install dependencies
pnpm build      # Build all packages
pnpm test       # Run tests
pnpm typecheck  # Type checking
```

## File Structure

```
sdks/
├── sdk-core/src/
│   ├── constants.ts    # Addresses, chain IDs
│   ├── entities/       # Token, CurrencyAmount, etc.
│   └── index.ts
├── v2-sdk/src/
│   ├── constants.ts    # V2-specific (INIT_CODE_HASH)
│   ├── entities/       # Pair, Route, Trade
│   └── index.ts
├── v3-sdk/src/
│   ├── constants.ts    # FeeAmount, TICK_SPACINGS
│   ├── entities/       # Pool, Position, Route, Trade
│   ├── utils/          # Math utilities
│   └── index.ts
└── router-sdk/src/
    ├── constants.ts    # Protocol enum
    ├── entities/       # MixedRouteSDK, Trade
    └── index.ts
```
