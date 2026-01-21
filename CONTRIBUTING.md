# Contributing to ETCswap SDKs

Thank you for your interest in contributing to ETCswap SDKs! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Requests](#pull-requests)
- [Coding Standards](#coding-standards)
- [Publishing](#publishing)

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

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
```

## Project Structure

```
sdks/
├── .github/
│   ├── CLAUDE.md              # Instructions for Claude Code
│   └── copilot-instructions.md # Instructions for GitHub Copilot
├── sdks/
│   ├── sdk-core/              # @etcswapv2/sdk-core
│   │   ├── src/
│   │   │   ├── constants.ts   # Chain IDs, addresses
│   │   │   ├── entities/      # Token, CurrencyAmount, Percent, etc.
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── v2-sdk/                # @etcswapv2/sdk
│   │   ├── src/
│   │   │   ├── constants.ts   # V2 INIT_CODE_HASH
│   │   │   ├── entities/      # Pair, Route, Trade
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── v3-sdk/                # @etcswapv3/sdk
│   │   ├── src/
│   │   │   ├── constants.ts   # FeeAmount, TICK_SPACINGS
│   │   │   ├── entities/      # Pool, Position, Route, Trade
│   │   │   ├── utils/         # Math utilities
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── router-sdk/            # @etcswapv3/router-sdk
│       ├── src/
│       │   ├── constants.ts   # Protocol enum
│       │   ├── entities/      # MixedRouteSDK, Trade
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── deployed-contracts.md       # Contract address reference
├── package.json               # Root workspace config
├── pnpm-workspace.yaml        # Workspace definition
├── tsconfig.base.json         # Shared TypeScript config
└── README.md
```

## Making Changes

### Adding New Features

1. Identify which package the feature belongs to
2. Create or modify files in the appropriate `src/` directory
3. Export new public APIs from `index.ts`
4. Add tests for new functionality
5. Update documentation if needed

### Modifying Contract Addresses

Contract addresses are defined in `sdks/sdk-core/src/constants.ts`. When updating:

1. Update the relevant address map
2. Update `deployed-contracts.md`
3. Verify addresses on block explorer before committing

### Adding New Chains

To add support for a new chain:

1. Add the chain ID to `ChainId` enum in `sdk-core/src/constants.ts`
2. Add contract addresses for the new chain to all address maps
3. Add INIT_CODE_HASH for the new chain
4. Update documentation

## Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd sdks/v2-sdk && pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Type checking only
pnpm typecheck
```

### Writing Tests

- Place tests in `__tests__/` directories
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies

## Pull Requests

### Before Submitting

1. Ensure all tests pass: `pnpm test`
2. Ensure types are correct: `pnpm typecheck`
3. Build succeeds: `pnpm build`
4. Update documentation for user-facing changes

### PR Guidelines

- Use descriptive titles
- Reference any related issues
- Include a summary of changes
- Add screenshots for UI changes (if applicable)

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(v3-sdk): add computePoolAddress utility
fix(sdk-core): correct WETC address for Mordor
docs: update README with V3 examples
```

## Coding Standards

### TypeScript

- Use strict mode (`"strict": true`)
- Prefer explicit types over `any`
- Use `JSBI` for big integer math (not native BigInt)
- Export types from index.ts

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- No semicolons (handled by Prettier)
- Max line length: 120 characters

### Naming Conventions

- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Files: `camelCase.ts` or `PascalCase.ts` for classes

### Documentation

- Add JSDoc comments to public APIs
- Include parameter descriptions
- Document return types
- Add examples for complex functions

## Publishing

### Version Bumping

1. Update version in `package.json` of affected packages
2. Follow semver:
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

### Publishing Process

```bash
# Build the package
cd sdks/<package-name>
pnpm build

# Publish (requires npm auth)
pnpm publish --access public
```

**Note:** pnpm automatically converts `workspace:*` dependencies to actual version numbers during publish.

### NPM Organizations

- `@etcswapv2` - V2 packages (including sdk-core)
- `@etcswapv3` - V3 packages
- `@etcswapv4` - V4 packages (future)

## Getting Help

- Open an issue for bugs or feature requests
- Join the ETCswap community for discussions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
