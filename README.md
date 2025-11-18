# Charm Crypt Reveal - Privacy-Preserving Rock Paper Scissors

A fully encrypted rock-paper-scissors game built with FHEVM (Fully Homomorphic Encryption Virtual Machine) and Zama's privacy-preserving technology.

## Live Demo & Demo Video

🚀 **[Live Demo](https://charm-crypt-reveal-1.vercel.app/)** - Try the game in your browser!

🎥 **[Demo Video](https://github.com/RodSimon333/charm-crypt-reveal/blob/main/charm-crypt-reveal.mp4)** - Watch the game in action.

## Features

- **Privacy-Preserving**: Player choices are encrypted and never revealed until game completion
- **On-Chain Game Logic**: All game logic and result calculation happens on-chain using encrypted data
- **Rainbow Wallet Integration**: Easy wallet connection using RainbowKit
- **Local & Sepolia Support**: Test locally or deploy to Sepolia testnet

## Project Structure

```
charm-crypt-reveal/
├── contracts/
│   └── RockPaperScissors.sol    # Main FHE-enabled game contract
├── test/
│   ├── RockPaperScissors.ts      # Local network tests
│   └── RockPaperScissorsSepolia.ts # Sepolia testnet tests
├── tasks/
│   └── RockPaperScissors.ts      # Hardhat tasks for contract interaction
├── ui/
│   ├── src/
│   │   ├── components/
│   │   │   └── RockPaperScissorsGame.tsx  # React game UI component
│   │   └── lib/
│   │       └── fhevm.ts          # FHEVM encryption/decryption utilities
│   ├── public/                   # Static assets
│   └── index.html               # Main HTML template
├── deploy/
│   └── deploy.ts                 # Contract deployment script
├── scripts/                      # Utility scripts
└── hardhat.config.ts            # Hardhat configuration
```

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- MetaMask wallet extension (for Sepolia testnet)
- Hardhat node running (for local development)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..
```

### 2. Set Up Environment Variables (Optional)

Create a `.env` file in the root directory:

```bash
# For Sepolia deployment and verification
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# UI contract address (after deployment)
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

## Local Development

### 1. Start Hardhat Node

In one terminal:
```bash
npx hardhat node
```

### 2. Deploy Contract

In another terminal:
```bash
npx hardhat deploy --network localhost
```

This will deploy the RockPaperScissors contract and print the contract address.

### 3. Update Frontend Contract Address

Set the contract address in `ui/.env`:
```
VITE_CONTRACT_ADDRESS=0x...
```

### 4. Start Frontend

```bash
cd ui
npm run dev
```

### 5. Test Contract (Optional)

```bash
# Submit player choice (0=Rock, 1=Scissors, 2=Paper)
npx hardhat --network localhost task:rps-submit-choice --choice 0

# Submit system choice
npx hardhat --network localhost task:rps-submit-system-choice --choice 1

# Get and decrypt result
npx hardhat --network localhost task:rps-get-result
```

## Running Tests

### Local Network Tests

```bash
npx hardhat test test/RockPaperScissors.ts
```

### Sepolia Testnet Tests

First deploy to Sepolia:
```bash
npx hardhat deploy --network sepolia
```

Then run tests:
```bash
npx hardhat test test/RockPaperScissorsSepolia.ts --network sepolia
```

## Game Flow

1. **Player Choice**: Player selects Rock (0), Scissors (1), or Paper (2)
   - Choice is encrypted locally using FHEVM
   - Encrypted choice is submitted to the contract

2. **System Choice**: System generates a random choice (0, 1, or 2)
   - System choice is encrypted
   - Encrypted system choice is submitted to the contract
   - Contract calculates the result using encrypted comparison

3. **Result Decryption**:
   - Result is decrypted by the player
   - Only the result (0=Draw, 1=Player Wins, 2=System Wins) is revealed
   - Player and system choices remain encrypted

## FHE Encryption & Decryption Logic

### Client-Side Encryption

The frontend uses Zama's FHEVM SDK to encrypt player choices before submitting to the blockchain:

```typescript
// Initialize FHEVM instance
const fhevm = await getFHEVMInstance(chainId);

// Encrypt player choice (0=Rock, 1=Scissors, 2=Paper)
const encrypted = await encryptChoice(fhevm, contractAddress, userAddress, choice);

// encrypted contains:
// - handles: Array of encrypted data handles
// - inputProof: Zero-knowledge proof for input verification
```

### On-Chain Encrypted Operations

The contract performs all game logic on encrypted data without decryption:

```solidity
// Compare encrypted choices homomorphically
ebool isDraw = FHE.eq(playerChoice, systemChoice);

// Calculate win conditions using encrypted arithmetic
ebool playerWins = FHE.or(
  FHE.and(FHE.eq(playerChoice, FHE.asEuint32(0)), FHE.eq(systemChoice, FHE.asEuint32(1))),
  FHE.and(FHE.eq(playerChoice, FHE.asEuint32(1)), FHE.eq(systemChoice, FHE.asEuint32(2))),
  FHE.and(FHE.eq(playerChoice, FHE.asEuint32(2)), FHE.eq(systemChoice, FHE.asEuint32(0)))
);

// Compute result using encrypted select operations
euint32 result = FHE.select(isDraw, FHE.asEuint32(0),
  FHE.select(playerWins, FHE.asEuint32(1), FHE.asEuint32(2)));
```

### Client-Side Decryption

Only the game result is decrypted, preserving privacy of individual choices:

```typescript
// Decrypt result using user's private key
const decryptedResult = await decryptEuint32(
  fhevm,
  encryptedResultHandle,
  contractAddress,
  userAddress,
  signer,
  chainId
);

// Result reveals only: 0=Draw, 1=Player Wins, 2=System Wins
// Individual choices (Rock/Scissors/Paper) remain encrypted
```

### Network-Specific Implementation

**Local Network (31337)**: Uses `@fhevm/mock-utils` for fast, signature-free encryption/decryption during development.

**Sepolia Testnet (11155111)**: Uses `@zama-fhe/relayer-sdk` with MetaMask signatures for production-ready encryption/decryption.

## Smart Contract Architecture

### RockPaperScissors.sol

The main contract implements a privacy-preserving rock-paper-scissors game using FHEVM:

```solidity
contract RockPaperScissors {
    struct Game {
        euint32 playerChoice;      // Encrypted player choice (0=Rock, 1=Scissors, 2=Paper)
        euint32 systemChoice;      // Encrypted system random choice
        euint32 result;            // Encrypted result (0=Draw, 1=Player Wins, 2=System Wins)
        bool isCompleted;          // Game completion status
    }

    mapping(address => Game) public games;
    mapping(address => uint256) public gameCount;
}
```

### Key Contract Functions

- `submitChoice(externalEuint32 playerChoiceEuint32, bytes calldata inputProof)`: Submit encrypted player choice
- `submitSystemChoice(externalEuint32 systemChoiceEuint32, bytes calldata inputProof)`: Submit encrypted system choice and calculate result
- `getGame(address player)`: Get game state (encrypted choices and result)
- `getGameCount(address player)`: Get number of games played by a player

### Game Logic Implementation

The contract calculates the game result using fully homomorphic encryption:

```solidity
// Result logic: 0 = Draw, 1 = Player Wins, 2 = System Wins
ebool isDraw = FHE.eq(game.playerChoice, encryptedSystemChoice);

// Player wins conditions (Rock>Scissors, Scissors>Paper, Paper>Rock)
ebool case1 = FHE.and(FHE.eq(game.playerChoice, FHE.asEuint32(0)), FHE.eq(encryptedSystemChoice, FHE.asEuint32(1)));
ebool case2 = FHE.and(FHE.eq(game.playerChoice, FHE.asEuint32(1)), FHE.eq(encryptedSystemChoice, FHE.asEuint32(2)));
ebool case3 = FHE.and(FHE.eq(game.playerChoice, FHE.asEuint32(2)), FHE.eq(encryptedSystemChoice, FHE.asEuint32(0)));

ebool playerWins = FHE.or(case1, FHE.or(case2, case3));
euint32 result = FHE.select(isDraw, FHE.asEuint32(0), FHE.select(playerWins, FHE.asEuint32(1), FHE.asEuint32(2)));
```

## Frontend Usage

1. Connect your wallet using RainbowKit (top right)
2. Ensure you're on the correct network (localhost:31337 or Sepolia:11155111)
3. Select your choice (Rock, Scissors, or Paper)
4. Wait for transaction confirmation
5. Click "Submit System Choice" to complete the game
6. Result will be automatically decrypted and displayed

## Technologies & Architecture

### Core Technologies

- **FHEVM (Fully Homomorphic Encryption Virtual Machine)**: Enables computation on encrypted data without decryption
- **Solidity ^0.8.24**: Smart contract development with FHE support
- **@fhevm/solidity**: FHE-enabled Solidity library
- **@zama-fhe/relayer-sdk**: Production FHE operations on Sepolia
- **@fhevm/mock-utils**: Development FHE operations on local network

### Frontend Stack

- **React 18 + TypeScript**: Modern frontend framework
- **RainbowKit + Wagmi**: Wallet connection and blockchain interaction
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Lucide React**: Icon library

### Development & Testing

- **Hardhat**: Ethereum development environment
- **@fhevm/hardhat-plugin**: FHEVM integration for Hardhat
- **hardhat-deploy**: Contract deployment management
- **TypeChain**: TypeScript bindings for contracts
- **Chai + Mocha**: Testing framework
- **solidity-coverage**: Code coverage analysis

### Deployment & Infrastructure

- **Vercel**: Frontend deployment platform
- **Infura**: Blockchain node provider
- **Etherscan**: Contract verification

## License

MIT

---

**Last updated**: November 18, 2025
