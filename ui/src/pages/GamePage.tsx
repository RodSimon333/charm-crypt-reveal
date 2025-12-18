import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers, BrowserProvider, Contract } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getFHEVMInstance, encryptChoice, decryptEuint32, resetFHEVMInstance } from "@/lib/fhevm";
import { getContractAddress } from "@/lib/contract";
import PageTransition from "@/components/PageTransition";
import { Hand, Circle, X, Loader2, Trophy, Frown, Equal, Sparkles } from "lucide-react";
import RockPaperScissorsArtifact from "@/abi/RockPaperScissors.json";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import Confetti from "@/components/Confetti";

const CONTRACT_ABI = (RockPaperScissorsArtifact as { abi: unknown[] }).abi;

const CHOICES = [
  { value: 0, label: "Rock", icon: Circle, color: "from-red-500 to-orange-500" },
  { value: 1, label: "Scissors", icon: X, color: "from-blue-500 to-cyan-500" },
  { value: 2, label: "Paper", icon: Hand, color: "from-green-500 to-emerald-500" },
];

const RESULT_CONFIG: Record<number, { label: string; icon: typeof Trophy; color: string; bgClass: string }> = {
  0: { label: "Draw!", icon: Equal, color: "text-yellow-400", bgClass: "neon-border-gold" },
  1: { label: "Victory!", icon: Trophy, color: "text-green-400", bgClass: "victory-glow" },
  2: { label: "Defeat", icon: Frown, color: "text-red-400", bgClass: "neon-border" },
};

const GamePage = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameCount, setGameCount] = useState<bigint>(0n);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [lastDecryptedResult, setLastDecryptedResult] = useState<string | null>(null);
  const [isStartingNewGame, setIsStartingNewGame] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const CONTRACT_ADDRESS = getContractAddress(chainId);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  useEffect(() => {
    if (isConnected && chainId) {
      initializeFHEVM();
    } else {
      resetFHEVMInstance();
      setFhevm(null);
    }
  }, [isConnected, chainId]);

  const decryptResult = useCallback(
    async (encryptedResult: string) => {
      if (!fhevm || !address || !CONTRACT_ADDRESS || isDecrypting) {
        return;
      }

      try {
        setIsDecrypting(true);
        const provider = new ethers.BrowserProvider(
          (window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum,
        );
        const signer = await provider.getSigner();

        const decryptedResult = await decryptEuint32(
          fhevm,
          encryptedResult,
          CONTRACT_ADDRESS,
          address,
          signer,
          chainId,
        );

        setShowReveal(true);
        setTimeout(() => {
          setResult(decryptedResult);
          if (decryptedResult === 1) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
        }, 500);

        toast({
          title: "Result Decrypted",
          description: RESULT_CONFIG[decryptedResult]?.label || "Unknown result",
        });
      } catch (error: unknown) {
        console.error("Failed to decrypt result:", error);

        const err = error as { message?: string; code?: number };
        const isUserRejection =
          err?.message?.includes("user rejected") || err?.message?.includes("User rejected") || err?.code === 4001;

        if (!isUserRejection) {
          toast({
            title: "Decryption Failed",
            description: err.message || "Failed to decrypt result",
            variant: "destructive",
          });
        }
        setLastDecryptedResult(null);
      } finally {
        setIsDecrypting(false);
      }
    },
    [fhevm, address, CONTRACT_ADDRESS, isDecrypting, chainId],
  );

  const loadGameState = useCallback(async () => {
    if (
      !isConnected ||
      !address ||
      !CONTRACT_ADDRESS ||
      CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
    ) {
      return;
    }

    if (isStartingNewGame) {
      return;
    }

    try {
      const provider = new BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      try {
        const gameCountValue = await contract.getGameCount(address);
        setGameCount(gameCountValue);
      } catch {
        setGameCount(0n);
      }

      try {
        const gameData = await contract.getGame(address);

        if (gameData && Array.isArray(gameData) && gameData.length >= 4) {
          const [, , encryptedResult, isCompleted] = gameData;
          setGameCompleted(isCompleted as boolean);

          if (
            isCompleted &&
            fhevm &&
            encryptedResult &&
            encryptedResult !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
            !isDecrypting &&
            encryptedResult !== lastDecryptedResult
          ) {
            setLastDecryptedResult(encryptedResult as string);
            decryptResult(encryptedResult as string);
          } else if (!isCompleted) {
            setResult(null);
            setLastDecryptedResult(null);
          }
        }
      } catch {
        setGameCompleted(false);
        setResult(null);
        setLastDecryptedResult(null);
      }
    } catch (error) {
      console.error("Failed to load game state:", error);
    }
  }, [
    isConnected,
    address,
    CONTRACT_ADDRESS,
    fhevm,
    isDecrypting,
    lastDecryptedResult,
    decryptResult,
    isStartingNewGame,
  ]);

  useEffect(() => {
    if (!isConnected || !address || !CONTRACT_ADDRESS) {
      return;
    }

    loadGameState();
    const interval = setInterval(loadGameState, 2000);
    return () => clearInterval(interval);
  }, [loadGameState]);

  const initializeFHEVM = async () => {
    try {
      setLoading(true);
      const instance = await getFHEVMInstance(chainId);
      setFhevm(instance);
      toast({
        title: "FHEVM Initialized",
        description: "Encryption system ready",
      });
    } catch (error: unknown) {
      console.error("FHEVM initialization failed:", error);
      const err = error as { message?: string };
      toast({
        title: "FHEVM Initialization Failed",
        description: err.message || "Please check your network connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerChoice = async (choice: number) => {
    if (!isConnected || !address || !fhevm || !CONTRACT_ADDRESS) {
      toast({
        title: "Not Ready",
        description: "Please connect your wallet and ensure FHEVM is initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setIsStartingNewGame(false);
      setPlayerChoice(choice);

      const encrypted = await encryptChoice(fhevm, CONTRACT_ADDRESS, address, choice);
      const provider = new BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      if (!encrypted.handles || encrypted.handles.length === 0) {
        throw new Error("Invalid encrypted data: no handles");
      }

      toast({
        title: "Submitting Choice",
        description: "Sending encrypted choice to contract...",
      });

      const tx = await contract.submitChoice(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      toast({
        title: "Choice Submitted",
        description: "Your encrypted choice has been submitted",
      });

      const timeoutId = setTimeout(loadGameState, 1000);
      timeoutRefs.current.push(timeoutId);
    } catch (error: unknown) {
      console.error("Failed to submit choice:", error);

      const err = error as { message?: string };
      let errorMessage = err.message || "Failed to submit choice";
      if (err.message?.includes("user rejected")) {
        errorMessage = "You rejected the transaction. Please try again.";
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setPlayerChoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemChoice = async () => {
    if (!isConnected || !address || !fhevm || !CONTRACT_ADDRESS) {
      toast({
        title: "Not Ready",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const randomChoice = Math.floor(Math.random() * 3);
      const encrypted = await encryptChoice(fhevm, CONTRACT_ADDRESS, address, randomChoice);
      const provider = new BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      toast({
        title: "Submitting System Choice",
        description: "Calculating result...",
      });

      const tx = await contract.submitSystemChoice(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      toast({
        title: "Game Complete",
        description: "Decrypting result...",
      });

      const timeoutId = setTimeout(loadGameState, 1000);
      timeoutRefs.current.push(timeoutId);
    } catch (error: unknown) {
      console.error("Failed to submit system choice:", error);
      const err = error as { message?: string };
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit system choice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewGame = () => {
    setIsStartingNewGame(true);
    setPlayerChoice(null);
    setResult(null);
    setGameCompleted(false);
    setLastDecryptedResult(null);
    setIsDecrypting(false);
    setLoading(false);
    setShowReveal(false);
    setShowConfetti(false);
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current = [];
  };

  if (!isConnected) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-card max-w-md w-full neon-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl glow-text">Connect Wallet</CardTitle>
              <CardDescription>Please connect your wallet to play</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-card max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle>Contract Not Deployed</CardTitle>
              <CardDescription>
                Please deploy the contract first using:
                <code className="block mt-2 p-2 bg-muted rounded text-xs">npx hardhat deploy --network localhost</code>
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {showConfetti && <Confetti />}
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
          <Card className="glass-card border-border/30">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl glow-text">Rock Paper Scissors</CardTitle>
              <CardDescription className="text-base">
                Privacy-preserving game powered by FHE
                {gameCount > 0n && (
                  <span className="block mt-1 text-primary">Games played: {gameCount.toString()}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <AnimatePresence mode="wait">
                {!gameCompleted ? (
                  playerChoice === null ? (
                    <motion.div
                      key="choice"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-center">Choose your move</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {CHOICES.map((choice, index) => {
                          const Icon = choice.icon;
                          return (
                            <motion.div
                              key={choice.value}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Button
                                onClick={() => handlePlayerChoice(choice.value)}
                                disabled={loading}
                                variant="outline"
                                className={`h-32 w-full flex-col gap-3 relative overflow-hidden group hover:neon-border transition-all duration-300`}
                              >
                                <motion.div
                                  className={`absolute inset-0 bg-gradient-to-br ${choice.color} opacity-0 group-hover:opacity-20 transition-opacity`}
                                />
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 10 }}
                                  transition={{ type: "spring", stiffness: 400 }}
                                >
                                  <Icon className="h-12 w-12" />
                                </motion.div>
                                <span className="text-lg font-medium">{choice.label}</span>
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                      {loading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center gap-2 text-muted-foreground"
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Processing...</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-6 text-center"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center neon-border"
                      >
                        {(() => {
                          const ChoiceIcon = CHOICES[playerChoice].icon;
                          return <ChoiceIcon className="h-12 w-12 text-primary" />;
                        })()}
                      </motion.div>
                      <div>
                        <p className="text-xl font-semibold">Choice Submitted!</p>
                        <p className="text-muted-foreground">Ready to reveal the result</p>
                      </div>
                      <Button
                        onClick={handleSystemChoice}
                        disabled={loading}
                        size="lg"
                        className="w-full max-w-xs neon-border"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Reveal Result
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="space-y-6 text-center"
                  >
                    {result !== null && (
                      <>
                        <motion.div
                          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${showReveal ? "reveal-animation" : ""} ${RESULT_CONFIG[result].bgClass}`}
                          initial={{ rotateY: 180 }}
                          animate={{ rotateY: 0 }}
                          transition={{ duration: 0.8, type: "spring" }}
                        >
                          {(() => {
                            const ResultIcon = RESULT_CONFIG[result].icon;
                            return <ResultIcon className={`h-16 w-16 ${RESULT_CONFIG[result].color}`} />;
                          })()}
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <h2
                            className={`text-4xl font-bold ${RESULT_CONFIG[result].color} ${result === 1 ? "glow-text-gold" : ""}`}
                          >
                            {RESULT_CONFIG[result].label}
                          </h2>
                          <p className="text-muted-foreground mt-2">
                            {result === 0 && "Great minds think alike!"}
                            {result === 1 && "Congratulations! You won!"}
                            {result === 2 && "Better luck next time!"}
                          </p>
                        </motion.div>
                      </>
                    )}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                      <Button onClick={startNewGame} size="lg" className="w-full max-w-xs neon-border">
                        Play Again
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default GamePage;
