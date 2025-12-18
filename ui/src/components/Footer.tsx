import { motion } from "framer-motion";
import { Sparkles, Github, Twitter, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-12 border-t border-border/30 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${15 + i * 20}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            <Sparkles
              className="h-4 w-4 text-primary"
              style={{ filter: "drop-shadow(0 0 8px hsl(var(--neon-purple)))" }}
            />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold glow-text mb-2">Charm Crypt Reveal</h3>
            <p className="text-sm text-muted-foreground">Where cryptographic magic meets gaming</p>
          </div>

          <div className="flex items-center gap-6">
            <motion.a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
              whileHover={{ scale: 1.2, rotate: 5 }}
            >
              <Github className="h-5 w-5" />
            </motion.a>
            <motion.a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
              whileHover={{ scale: 1.2, rotate: -5 }}
            >
              <Twitter className="h-5 w-5" />
            </motion.a>
            <motion.a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
              whileHover={{ scale: 1.2, rotate: 5 }}
            >
              <Globe className="h-5 w-5" />
            </motion.a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/20 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Charm Crypt Reveal. Built with FHE technology.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
