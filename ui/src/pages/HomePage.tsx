import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageTransition from "@/components/PageTransition";
import { Gamepad2, Shield, Zap, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your choices are encrypted using FHE technology. No one can see your moves.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Fast on-chain computation with encrypted data processing.",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "View your game statistics and history on the dashboard.",
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 glow-text"
            animate={{
              textShadow: [
                "0 0 20px hsl(270 100% 65% / 0.5)",
                "0 0 40px hsl(270 100% 65% / 0.8)",
                "0 0 20px hsl(270 100% 65% / 0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Charm Crypt Reveal
          </motion.h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience the future of gaming with fully homomorphic encryption. Play Rock Paper Scissors where your
            choices remain completely private.
          </p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button size="lg" className="gap-2 neon-border text-lg px-8" onClick={() => navigate("/game")}>
              <Gamepad2 className="h-5 w-5" />
              Start Playing
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-lg px-8" onClick={() => navigate("/dashboard")}>
              <BarChart3 className="h-5 w-5" />
              View Dashboard
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 w-full max-w-5xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="glass-card h-full border-border/30 hover:neon-border transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center"
                      whileHover={{ rotate: 10 }}
                    >
                      <Icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-primary">Zama FHEVM</span> on Ethereum
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default HomePage;
