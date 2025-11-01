// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Rock Paper Scissors Game with FHE
/// @notice A privacy-preserving rock-paper-scissors game where player choices are encrypted
/// @dev 0 = Rock, 1 = Scissors, 2 = Paper
/// @dev Supports multi-round games with encrypted scoring

    // Updated: 2025-11-16 15:07

     is SepoliaConfig {
    struct Game {
        euint32 playerChoice;      // Encrypted player choice (0, 1, or 2)
        euint32 systemChoice;       // Encrypted system random choice (0, 1, or 2)
        euint32 result;             // Encrypted result (0 = Draw, 1 = Player Wins, 2 = System Wins)
        bool isCompleted;           // Whether the game is completed
    }

    struct GameStats {
        uint256 totalGames;
        euint32 playerWins;         // Encrypted total player wins
        euint32 systemWins;         // Encrypted total system wins
        euint32 draws;              // Encrypted total draws
        uint256 lastGameTimestamp;
    }

    mapping(address => Game) public games;
    mapping(address => uint256) public gameCount;
    mapping(address => GameStats) public gameStats;

    /// @notice Submit player's encrypted choice
    /// @param playerChoiceEuint32 The encrypted player choice (0=Rock, 1=Scissors, 2=Paper)
    /// @param inputProof The input proof for the encrypted choice
    function submitChoice(externalEuint32 playerChoiceEuint32, bytes calldata inputProof) external {
        euint32 encryptedChoice = FHE.fromExternal(playerChoiceEuint32, inputProof);
        
        // Initialize new game
        games[msg.sender] = Game({
            playerChoice: encryptedChoice,
            systemChoice: FHE.asEuint32(0), // Will be set by system
            result: FHE.asEuint32(0),
            isCompleted: false
        });
        
        gameCount[msg.sender]++;
        
        // Allow contract to access player choice
        FHE.allowThis(encryptedChoice);
        FHE.allow(encryptedChoice, msg.sender);
    }

    /// @notice System submits random encrypted choice and calculates result
    /// @param systemChoiceEuint32 The encrypted system random choice (0=Rock, 1=Scissors, 2=Paper)
    /// @param inputProof The input proof for the encrypted choice
    function submitSystemChoice(externalEuint32 systemChoiceEuint32, bytes calldata inputProof) external {
        Game storage game = games[msg.sender];
        require(!game.isCompleted, "Game already completed");
        
        euint32 encryptedSystemChoice = FHE.fromExternal(systemChoiceEuint32, inputProof);
        game.systemChoice = encryptedSystemChoice;
        
        // Calculate result using encrypted comparison
        // Result logic:
        // 0 = Draw (playerChoice == systemChoice)
        // 1 = Player Wins (player beats system)
        // 2 = System Wins (system beats player)
        
        // Check for draw first
        ebool isDraw = FHE.eq(game.playerChoice, encryptedSystemChoice);
        
        // Calculate win conditions
        // Player wins: (player=0 && system=1) || (player=1 && system=2) || (player=2 && system=0)
        
        // Check: player=0 && system=1
        ebool case1 = FHE.and(
            FHE.eq(game.playerChoice, FHE.asEuint32(0)),
            FHE.eq(encryptedSystemChoice, FHE.asEuint32(1))
        );
        
        // Check: player=1 && system=2
        ebool case2 = FHE.and(
            FHE.eq(game.playerChoice, FHE.asEuint32(1)),
            FHE.eq(encryptedSystemChoice, FHE.asEuint32(2))
        );
        
        // Check: player=2 && system=0
        ebool case3 = FHE.and(
            FHE.eq(game.playerChoice, FHE.asEuint32(2)),
            FHE.eq(encryptedSystemChoice, FHE.asEuint32(0))
        );
        
        // Combine all win cases
        ebool playerWins = FHE.or(case1, FHE.or(case2, case3));
        
        // Result: 0 if draw, 1 if player wins, 2 if system wins
        // First check if draw, if not then check if player wins
        euint32 resultIfNotDraw = FHE.select(playerWins, FHE.asEuint32(1), FHE.asEuint32(2));
        euint32 result = FHE.select(isDraw, FHE.asEuint32(0), resultIfNotDraw);
        
        game.result = result;
        game.isCompleted = true;

        // Update encrypted game statistics
        updateGameStats(msg.sender, result);

        // Allow contract and player to access results
        FHE.allowThis(game.systemChoice);
        FHE.allow(game.systemChoice, msg.sender);
        FHE.allowThis(game.result);
        FHE.allow(game.result, msg.sender);
    }

    /// @notice Get the current game for a player
    /// @param player The player's address
    /// @return playerChoice The encrypted player choice
    /// @return systemChoice The encrypted system choice
    /// @return result The encrypted result
    /// @return isCompleted Whether the game is completed
    function getGame(address player) external view returns (
        euint32 playerChoice,
        euint32 systemChoice,
        euint32 result,
        bool isCompleted
    ) {
        Game memory game = games[player];
        return (game.playerChoice, game.systemChoice, game.result, game.isCompleted);
    }

    /// @notice Get player's game count
    /// @param player The player's address
    /// @return count The number of games played
    function getGameCount(address player) external view returns (uint256) {
        return gameCount[player];
    }

    /// @notice Get player's encrypted game statistics
    /// @param player The player's address
    /// @return totalGames Total games played
    /// @return playerWins Encrypted player wins count
    /// @return systemWins Encrypted system wins count
    /// @return draws Encrypted draws count
    /// @return lastGameTimestamp Timestamp of last game
    function getGameStats(address player) external view returns (
        uint256 totalGames,
        euint32 playerWins,
        euint32 systemWins,
        euint32 draws,
        uint256 lastGameTimestamp
    ) {
        GameStats memory stats = gameStats[player];
        return (stats.totalGames, stats.playerWins, stats.systemWins, stats.draws, stats.lastGameTimestamp);
    }

    /// @notice Update game statistics after game completion
    /// @param player The player's address
    /// @param result The game result (0=Draw, 1=Player Wins, 2=System Wins)
    function updateGameStats(address player, euint32 result) internal {
        GameStats storage stats = gameStats[player];

        // Initialize stats if first game
        if (stats.totalGames == 0) {
            stats.playerWins = FHE.asEuint32(0);
            stats.systemWins = FHE.asEuint32(0);
            stats.draws = FHE.asEuint32(0);
        }

        // Update encrypted counters based on result
        ebool isDraw = FHE.eq(result, FHE.asEuint32(0));
        ebool isPlayerWin = FHE.eq(result, FHE.asEuint32(1));
        ebool isSystemWin = FHE.eq(result, FHE.asEuint32(2));

        // Increment appropriate counter
        stats.draws = FHE.select(isDraw, FHE.add(stats.draws, FHE.asEuint32(1)), stats.draws);
        stats.playerWins = FHE.select(isPlayerWin, FHE.add(stats.playerWins, FHE.asEuint32(1)), stats.playerWins);
        stats.systemWins = FHE.select(isSystemWin, FHE.add(stats.systemWins, FHE.asEuint32(1)), stats.systemWins);

        stats.totalGames++;
        stats.lastGameTimestamp = block.timestamp;

        // Allow player to access their stats
        FHE.allowThis(stats.playerWins);
        FHE.allowThis(stats.systemWins);
        FHE.allowThis(stats.draws);
        FHE.allow(stats.playerWins, player);
        FHE.allow(stats.systemWins, player);
        FHE.allow(stats.draws, player);
    }

    /// @notice Reset player statistics (for testing purposes)
    /// @param player The player's address
    function resetGameStats(address player) external {
        require(msg.sender == player, "Can only reset own stats");
        delete gameStats[player];
    }
}

