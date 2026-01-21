# ETCswap V4 SDK Roadmap

This document outlines the planned development of the ETCswap V4 SDK, which will be published under the `@etcswapv4` npm organization.

## Overview

Uniswap V4 introduces a revolutionary "hooks" architecture that allows custom logic to be executed at various points during swap and liquidity operations. When ETCswap forks Uniswap V4 contracts, we will need corresponding SDK support.

## NPM Organization

The V4 SDK will use a new npm organization:
- Organization: `etcswapv4`
- Package: `@etcswapv4/sdk`

## Package Structure

```
sdks/
└── v4-sdk/                    # @etcswapv4/sdk
    ├── src/
    │   ├── constants.ts       # V4-specific constants
    │   ├── entities/
    │   │   ├── pool.ts        # V4 Pool with hooks support
    │   │   ├── position.ts    # V4 Position
    │   │   ├── route.ts       # V4 Route
    │   │   ├── trade.ts       # V4 Trade
    │   │   └── hook.ts        # Hook abstraction
    │   ├── utils/
    │   │   ├── computePoolId.ts
    │   │   ├── hookAddress.ts
    │   │   └── ...
    │   └── index.ts
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

## Key Differences from V3

### Pool Identification

V4 pools are identified by a `PoolKey` struct rather than a computed address:

```typescript
interface PoolKey {
  currency0: Currency
  currency1: Currency
  fee: number
  tickSpacing: number
  hooks: string  // Hook contract address
}
```

### Singleton Contract

V4 uses a single `PoolManager` contract instead of individual pool contracts:

```typescript
// V4 addresses (to be deployed)
const POOL_MANAGER_ADDRESS: { [chainId: number]: string } = {
  [ChainId.CLASSIC]: '0x...', // TBD
  [ChainId.MORDOR]: '0x...',  // TBD
}
```

### Hook System

Hooks can modify pool behavior at these points:
- `beforeInitialize` / `afterInitialize`
- `beforeAddLiquidity` / `afterAddLiquidity`
- `beforeRemoveLiquidity` / `afterRemoveLiquidity`
- `beforeSwap` / `afterSwap`
- `beforeDonate` / `afterDonate`

```typescript
// Hook flags (encoded in address)
enum HookFlags {
  BEFORE_INITIALIZE = 1 << 0,
  AFTER_INITIALIZE = 1 << 1,
  BEFORE_ADD_LIQUIDITY = 1 << 2,
  AFTER_ADD_LIQUIDITY = 1 << 3,
  // ... etc
}
```

### Native Currency Support

V4 natively supports ETH/ETC without wrapping:

```typescript
// In V4, use address(0) for native currency
const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'
```

## Implementation Plan

### Phase 1: Core Types
- [ ] Create `sdks/v4-sdk/` directory structure
- [ ] Define `PoolKey` and `PoolId` types
- [ ] Implement `Currency` extensions for native support
- [ ] Add V4 constants and addresses

### Phase 2: Pool and Position
- [ ] Implement V4 `Pool` entity
- [ ] Implement V4 `Position` entity
- [ ] Port liquidity math from Uniswap v4-sdk

### Phase 3: Trading
- [ ] Implement V4 `Route` entity
- [ ] Implement V4 `Trade` entity
- [ ] Add swap quote functionality

### Phase 4: Hook Support
- [ ] Define hook interface abstractions
- [ ] Implement hook address validation
- [ ] Add hook flag utilities

### Phase 5: Router Integration
- [ ] Update `@etcswapv3/router-sdk` to support V4 routes
- [ ] Add mixed V2/V3/V4 routing support

## Dependencies

```json
{
  "dependencies": {
    "@etcswapv2/sdk-core": "^1.0.0",
    "@ethersproject/abi": "^5.7.0",
    "@ethersproject/address": "^5.7.0",
    "jsbi": "^3.2.5",
    "tiny-invariant": "^1.3.1"
  }
}
```

## Contract Addresses (TBD)

When V4 contracts are deployed, update:

1. `sdks/sdk-core/src/constants.ts`:
   ```typescript
   export const V4_POOL_MANAGER_ADDRESS: { [chainId: number]: string } = {
     [ChainId.CLASSIC]: '0x...',
     [ChainId.MORDOR]: '0x...',
   }
   ```

2. `deployed-contracts.md`

## Reference Implementation

The SDK should be based on:
- Uniswap v4-sdk: https://github.com/Uniswap/sdks/tree/main/sdks/v4-sdk
- Uniswap v4-core: https://github.com/Uniswap/v4-core

## Timeline

- **Contracts Fork**: After Uniswap V4 mainnet launch stabilizes
- **SDK Development**: Following contract deployment
- **SDK Release**: After testing on Mordor testnet

## Notes for AI Coding Assistants

When implementing the V4 SDK:

1. **Follow existing patterns**: Use the same code structure as v3-sdk
2. **Maintain type consistency**: Use `@etcswapv2/sdk-core` for shared types
3. **JSBI compatibility**: Continue using JSBI ^3.x
4. **Test thoroughly**: V4 math is complex, ensure comprehensive tests
5. **Document hooks**: The hook system is new, needs clear documentation
