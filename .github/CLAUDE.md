# Claude Code Instructions for ETCswap SDKs

This document provides instructions for Claude Code (and other AI coding assistants) when working on the ETCswap SDK monorepo.

## Repository Overview

This is a **pnpm monorepo** containing TypeScript SDKs for ETCswap, a decentralized exchange on Ethereum Classic. The SDKs are forks of Uniswap SDKs, adapted for ETCswap's deployment on ETC.

### Package Structure

```
sdks/
├── sdk-core/       # @etcswapv2/sdk-core - Core types, shared across all SDKs
├── v2-sdk/         # @etcswapv2/sdk - V2 AMM (constant product)
├── v3-sdk/         # @etcswapv3/sdk - V3 CLMM (concentrated liquidity)
├── router-sdk/     # @etcswapv3/router-sdk - Universal Router integration
└── v4-sdk/         # @etcswapv4/sdk - FUTURE: V4 hooks-based AMM
```

### NPM Organizations

- `@etcswapv2/*` - V2 packages (sdk-core lives here as it was created for V2 first)
- `@etcswapv3/*` - V3 packages
- `@etcswapv4/*` - V4 packages (future)

## Key Technical Details

### Chain IDs

```typescript
ChainId.CLASSIC = 61   // Ethereum Classic mainnet
ChainId.MORDOR = 63    // Mordor testnet
```

### Critical: Contract Addresses and INIT_CODE_HASH Values

**IMPORTANT:** Always verify contract addresses against the source of truth: `deployed-contracts.md`

ETCswap uses **DIFFERENT** contract addresses and INIT_CODE_HASH values than Uniswap. These are critical for computing pool/pair addresses via CREATE2:

**V2 Contracts (DIFFERENT per network):**
- Classic Factory: `0x0307cd3D7DA98A29e6Ed0D2137be386Ec1e4Bc9C`
- Classic Router: `0x79Bf07555C34e68C4Ae93642d1007D7f908d60F5`
- Mordor Factory: `0x212eE1B5c8C26ff5B2c4c14CD1C54486Fe23ce70`
- Mordor Router: `0x582A87594c86b204920f9e337537b5Aa1fefC07C`

**V3 Contracts (SAME for both networks):**
- Factory: `0x2624E907BcC04f93C8f29d7C7149a8700Ceb8cDC`
- SwapRouter02: `0xEd88EDD995b00956097bF90d39C9341BBde324d1`
- Universal Router: `0x9b676E761040D60C6939dcf5f582c2A4B51025F1`
- Position Manager: `0x3CEDe6562D6626A04d7502CC35720901999AB699`
- QuoterV2: `0x4d8c163400CB87Cbe1bae76dBf36A09FED85d39B`

**V2 Pair INIT_CODE_HASH:**
- Classic: `0xb5e58237f3a44220ffc3dfb989e53735df8fcd9df82c94b13105be8380344e52`
- Mordor: `0x4d8a51f257ed377a6ac3f829cd4226c892edbbbcb87622bcc232807b885b1303`

**V3 Pool INIT_CODE_HASH:**
- All networks: `0x7ea2da342810af3c5a9b47258f990aaac829fe1385a1398feb77d0126a85dbef`

**NEVER** use Uniswap's default addresses or INIT_CODE_HASH values - they will compute incorrect addresses.

### JSBI Version

All SDKs use JSBI ^3.x for compatibility with Uniswap SDKs. Do NOT upgrade to JSBI 4.x as it causes type incompatibilities.

## Common Tasks

### Adding a New Token Constant

1. Edit `sdks/sdk-core/src/constants.ts`
2. Add the token address for each chain ID
3. Export from `sdks/sdk-core/src/index.ts`
4. Rebuild: `pnpm build`

### Adding a New Contract Address

1. Edit `sdks/sdk-core/src/constants.ts`
2. Add to the appropriate address map (e.g., `V3_FACTORY_ADDRESS`)
3. Update `deployed-contracts.md` if needed

### Adding a New Utility Function

1. Create the file in the appropriate SDK's `src/utils/` directory
2. Export from `src/utils/index.ts`
3. The main `src/index.ts` already re-exports all utils

### Publishing Updates

1. Update version in `package.json` of affected packages
2. Run `pnpm build` to rebuild
3. Publish from workspace root: `cd sdks/<package> && pnpm publish --access public`

**Important:** pnpm automatically converts `workspace:*` to actual version numbers during publish.

## Testing Strategy

Each SDK has its own `jest` configuration. Run tests with:

```bash
pnpm test           # Run all tests
pnpm -r test        # Run tests in all packages
```

## Code Style

- TypeScript strict mode enabled
- Use `JSBI` for big integer math (not native BigInt)
- Prefer immutable patterns
- Export types explicitly from index.ts

## Dependencies

### Shared Dependencies (sdk-core)
- `@ethersproject/*` - Ethereum utilities
- `jsbi` - Big integer math
- `tiny-invariant` - Runtime assertions

### V2-specific
- Inherits from sdk-core

### V3-specific
- Inherits from sdk-core
- Complex math utilities for concentrated liquidity

### Router-specific
- Depends on sdk-core, v2-sdk, and v3-sdk
- Handles cross-protocol routing

## Future Work: V4 SDK

When creating the V4 SDK:

1. Create `sdks/v4-sdk/` directory
2. Use `@etcswapv4/sdk` package name
3. Add to `pnpm-workspace.yaml`
4. V4 introduces hooks - will need new entity types
5. Reference Uniswap's v4-sdk for structure

## Debugging Tips

1. **Address Mismatch**: Check INIT_CODE_HASH values
2. **Type Errors**: Check JSBI version consistency
3. **Build Errors**: Run `pnpm clean && pnpm build`
4. **Publish Errors**: Ensure you're logged into npm with correct org access

## Important Files

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Defines workspace packages |
| `tsconfig.base.json` | Shared TypeScript config |
| `deployed-contracts.md` | All contract addresses |
| `sdks/sdk-core/src/constants.ts` | Chain IDs, addresses, hashes |

## Contact

For questions about ETCswap:
- GitHub: https://github.com/etcswap
- Website: https://etcswap.org
