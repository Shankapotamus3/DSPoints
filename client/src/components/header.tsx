import { useQuery, useMutation } from "@tanstack/react-query";
import { Trophy, Coins, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/notification-center";
import InstallPrompt from "@/components/install-prompt";
import { useEffect } from "react";
import { notificationService } from "@/lib/notificationService";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: { points: number; isAdmin?: boolean } | undefined };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setLocation("/login");
    },
  });

  // Initialize notification service
  useEffect(() => {
    notificationService.startPolling();
    // Request notification permission on first load
    notificationService.requestPermission();
  }, []);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="text-primary-foreground" size={16} />
            </div>
            <h1 className="text-lg md:text-2xl font-bold gradient-text">ChoreRewards</h1>
          </div>
          
          {/* Points Display & Actions */}
          <div className="flex items-center gap-1 md:gap-4">
            <div className="flex items-center gap-1 md:gap-2 bg-accent/10 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border" data-testid="points-display">
              <Coins className="text-accent" size={18} />
              <span className="font-semibold text-sm md:text-lg">{user?.points?.toLocaleString() ?? 0}</span>
              <span className="text-muted-foreground text-xs md:text-sm hidden sm:inline">points</span>
            </div>
            
            {/* PWA Install Prompt - show on all devices */}
            <InstallPrompt />
            
            {/* Notifications */}
            <NotificationCenter />
            
            {/* Theme Toggle - hidden on very small screens */}
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleTheme}
              data-testid="button-theme-toggle"
              className="hidden xs:inline-flex"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
