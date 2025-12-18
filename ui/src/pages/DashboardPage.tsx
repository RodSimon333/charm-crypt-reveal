import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { BrowserProvider, Contract } from "ethers";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractAddress } from "@/lib/contract";
import PageTransition from "@/components/PageTransition";
import { Gamepad2, Trophy, TrendingUp, Activity, Wallet, Clock, Target, Zap } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import RockPaperScissorsArtifact from "@/abi/RockPaperScissors.json";

const CONTRACT_ABI = (RockPaperScissorsArtifact as { abi: unknown[] }).abi;

interface GameStats {
  totalGames: number;
  currentGameCompleted: boolean;
  walletConnected: boolean;
  contractDeployed: boolean;
}

const CHART_COLORS = {
  primary: "hsl(270, 70%, 55%)",
  secondary: "hsl(45, 90%, 55%)",
  accent: "hsl(180, 70%, 50%)",
  muted: "hsl(250, 20%, 40%)",
};

const DashboardPage = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    currentGameCompleted: false,
    walletConnected: false,
    contractDeployed: false,
  });
  const [loading, setLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState<{ game: number; timestamp: number }[]>([]);

  const CONTRACT_ADDRESS = getContractAddress(chainId);

  const loadStats = useCallback(async () => {
    if (!isConnected || !address) {
      setStats((prev) => ({ ...prev, walletConnected: false }));
      setLoading(false);
      return;
    }

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setStats((prev) => ({ ...prev, walletConnected: true, contractDeployed: false }));
      setLoading(false);
      return;
    }

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      let gameCount = 0;
      let isCompleted = false;

      try {
        const count = await contract.getGameCount(address);
        gameCount = Number(count);
      } catch {
        gameCount = 0;
      }

      try {
        const gameData = await contract.getGame(address);
        if (gameData && Array.isArray(gameData) && gameData.length >= 4) {
          isCompleted = gameData[3] as boolean;
        }
      } catch {
        isCompleted = false;
      }

      setStats({
        totalGames: gameCount,
        currentGameCompleted: isCompleted,
        walletConnected: true,
        contractDeployed: true,
      });

      // Generate game history based on actual game count
      const history = [];
      for (let i = 1; i <= gameCount; i++) {
        history.push({
          game: i,
          timestamp: Date.now() - (gameCount - i) * 60000,
        });
      }
      setGameHistory(history);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, CONTRACT_ADDRESS]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Generate chart data based on actual stats
  const activityData =
    gameHistory.length > 0
      ? gameHistory.slice(-7).map((h, i) => ({
          name: `Game ${h.game}`,
          games: 1,
          cumulative: i + 1,
        }))
      : [{ name: "No games", games: 0, cumulative: 0 }];

  const statusData = [
    { name: "Completed", value: stats.totalGames, color: CHART_COLORS.primary },
    {
      name: "In Progress",
      value: stats.currentGameCompleted ? 0 : stats.totalGames > 0 ? 1 : 0,
      color: CHART_COLORS.secondary,
    },
  ].filter((d) => d.value > 0);

  const performanceData = [
    { metric: "Games", value: stats.totalGames },
    { metric: "Active", value: stats.currentGameCompleted ? 0 : 1 },
    { metric: "Sessions", value: Math.ceil(stats.totalGames / 3) || 1 },
  ];

  const statCards = [
    {
      title: "Total Games",
      value: stats.totalGames.toString(),
      icon: Gamepad2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Current Status",
      value: stats.currentGameCompleted ? "Completed" : "In Progress",
      icon: Activity,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Wallet Status",
      value: stats.walletConnected ? "Connected" : "Disconnected",
      icon: Wallet,
      color: stats.walletConnected ? "text-green-400" : "text-red-400",
      bgColor: stats.walletConnected ? "bg-green-400/10" : "bg-red-400/10",
    },
    {
      title: "Contract Status",
      value: stats.contractDeployed ? "Deployed" : "Not Found",
      icon: Target,
      color: stats.contractDeployed ? "text-green-400" : "text-yellow-400",
      bgColor: stats.contractDeployed ? "bg-green-400/10" : "bg-yellow-400/10",
    },
  ];

  if (!isConnected) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-card max-w-md w-full neon-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl glow-text">Connect Wallet</CardTitle>
              <CardDescription>Please connect your wallet to view dashboard</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold glow-text mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Your game statistics and analytics</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="glass-card border-border/30 hover:neon-border transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{loading ? "..." : stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Game Activity
                </CardTitle>
                <CardDescription>Your cumulative game progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 30%, 20%)" />
                      <XAxis dataKey="name" stroke="hsl(210, 15%, 60%)" fontSize={12} />
                      <YAxis stroke="hsl(210, 15%, 60%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(250, 25%, 12%)",
                          border: "1px solid hsl(250, 30%, 20%)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS.primary, strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: CHART_COLORS.secondary }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  Game Status
                </CardTitle>
                <CardDescription>Distribution of game states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(250, 25%, 12%)",
                            border: "1px solid hsl(250, 30%, 20%)",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No games played yet</p>
                  )}
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Overview of your gaming activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 30%, 20%)" />
                    <XAxis dataKey="metric" stroke="hsl(210, 15%, 60%)" fontSize={12} />
                    <YAxis stroke="hsl(210, 15%, 60%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(250, 25%, 12%)",
                        border: "1px solid hsl(250, 30%, 20%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Session Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground mb-1">Connected Address</p>
                  <p className="font-mono text-xs truncate">{address}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground mb-1">Network</p>
                  <p className="font-medium">
                    {chainId === 31337 ? "Localhost" : chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground mb-1">Contract</p>
                  <p className="font-mono text-xs truncate">{CONTRACT_ADDRESS}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;
