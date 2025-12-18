import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad2, LayoutDashboard, Home, Info } from "lucide-react";
import logo from "@/assets/logo.svg";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/game", label: "Play", icon: Gamepad2 },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/about", label: "About", icon: Info },
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 backdrop-blur-xl bg-background/70">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group">
          <motion.img
            src={logo}
            alt="Charm Crypt Reveal"
            className="h-10 w-10 rounded-full neon-border"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400 }}
          />
          <div>
            <h1 className="text-xl font-bold glow-text group-hover:glow-text-cyan transition-all duration-300">
              Charm Crypt Reveal
            </h1>
            <p className="text-xs text-muted-foreground">Privacy-Preserving Games</p>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink key={item.path} to={item.path} className="relative px-4 py-2 rounded-lg transition-colors">
                <motion.div
                  className={`flex items-center gap-2 ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-lg neon-border"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center">
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </header>
  );
};

export default Header;
