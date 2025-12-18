import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageTransition from "@/components/PageTransition";
import { Shield, Lock, Cpu, Code, ExternalLink } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Fully Homomorphic Encryption",
    description:
      "FHE allows computations on encrypted data without decryption. Your game choices remain private throughout the entire process.",
  },
  {
    icon: Lock,
    title: "Zero Knowledge",
    description:
      "Neither the contract nor any observer can see your actual choice. Only the final result is revealed after both parties commit.",
  },
  {
    icon: Cpu,
    title: "On-Chain Computation",
    description:
      "All game logic runs directly on the blockchain using encrypted values. No trusted third party required.",
  },
  {
    icon: Code,
    title: "Open Source",
    description:
      "Built with Zama's FHEVM technology. The smart contract and frontend code are fully transparent and auditable.",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Connect Wallet",
    description: "Connect your Ethereum wallet to interact with the smart contract.",
  },
  {
    step: 2,
    title: "Make Your Choice",
    description: "Select Rock, Paper, or Scissors. Your choice is encrypted client-side before submission.",
  },
  {
    step: 3,
    title: "Submit Encrypted Choice",
    description: "The encrypted choice is sent to the smart contract. No one can see what you chose.",
  },
  {
    step: 4,
    title: "System Response",
    description: "A random system choice is generated and encrypted. The result is computed on encrypted values.",
  },
  {
    step: 5,
    title: "Reveal Result",
    description: "Only the final result (win/lose/draw) is decrypted and revealed. Individual choices remain private.",
  },
];

const AboutPage = () => {
  return (
    <PageTransition>
      <div className="space-y-12 py-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold glow-text mb-4">About Charm Crypt Reveal</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A privacy-preserving Rock Paper Scissors game powered by Fully Homomorphic Encryption (FHE) technology.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-2xl font-bold mb-6 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="glass-card h-full border-border/30 hover:neon-border transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center">How It Works</CardTitle>
              <CardDescription className="text-center">Step-by-step guide to playing the game</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {howItWorks.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                      <span className="text-primary font-bold">{item.step}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Technology Stack */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { name: "Zama FHEVM", desc: "FHE Library" },
                  { name: "Solidity", desc: "Smart Contract" },
                  { name: "React", desc: "Frontend" },
                  { name: "Ethereum", desc: "Blockchain" },
                ].map((tech) => (
                  <div key={tech.name} className="p-4 rounded-lg bg-muted/30">
                    <p className="font-semibold text-primary">{tech.name}</p>
                    <p className="text-xs text-muted-foreground">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">Learn more about FHE technology</p>
          <a
            href="https://www.zama.ai/fhevm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Visit Zama FHEVM Documentation
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AboutPage;
