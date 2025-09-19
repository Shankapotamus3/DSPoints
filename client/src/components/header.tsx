import { useQuery } from "@tanstack/react-query";
import { Trophy, Coins, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/notification-center";
import { useEffect } from "react";
import { notificationService } from "@/lib/notificationService";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: { points: number; isAdmin?: boolean } | undefined };

  // Initialize notification service
  useEffect(() => {
    notificationService.startPolling();
    // Request notification permission on first load
    notificationService.requestPermission();
  }, []);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="text-primary-foreground" size={20} />
            </div>
            <h1 className="text-2xl font-bold gradient-text">ChoreRewards</h1>
          </div>
          
          {/* Points Display */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-accent/10 px-4 py-2 rounded-lg border" data-testid="points-display">
              <Coins className="text-accent" size={20} />
              <span className="font-semibold text-lg">{user?.points?.toLocaleString() ?? 0}</span>
              <span className="text-muted-foreground text-sm">points</span>
            </div>
            
            {/* Notifications */}
            <NotificationCenter />
            
            {/* Theme Toggle */}
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
