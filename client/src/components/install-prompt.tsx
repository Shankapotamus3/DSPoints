import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, X, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  onInstallStatusChange?: (installed: boolean) => void;
}

export default function InstallPrompt({ onInstallStatusChange }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        onInstallStatusChange?.(true);
        return;
      }

      // Check if running as PWA on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        onInstallStatusChange?.(true);
        return;
      }

      // Check for installed related apps
      if ('getInstalledRelatedApps' in navigator) {
        (navigator as any).getInstalledRelatedApps().then((installedApps: any[]) => {
          if (installedApps.length > 0) {
            setIsInstalled(true);
            onInstallStatusChange?.(true);
          }
        });
      }
    };

    checkInstallStatus();

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      
      // Show install button after a short delay
      setTimeout(() => {
        setShowInstallButton(true);
      }, 2000);
    };

    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      onInstallStatusChange?.(true);
    };

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstallStatusChange]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowDialog(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`PWA: User ${outcome} the install prompt`);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        onInstallStatusChange?.(true);
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallButton(false);
    } catch (error) {
      console.error('PWA: Install prompt failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    // Show again after 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if user previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - dismissedTime < dayInMs) {
        setShowInstallButton(false);
      }
    }
  }, []);

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <>
      {/* Install Button */}
      {showInstallButton && !isInstalled && (
        <div className="relative">
          <Button
            onClick={handleInstallClick}
            variant="outline"
            size="sm"
            className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
            data-testid="button-install-pwa"
          >
            <Download className="w-4 h-4 mr-1" />
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-background border"
            data-testid="button-dismiss-install"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Manual Install Instructions Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-install-instructions">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Install ChoreRewards
            </DialogTitle>
            <DialogDescription>
              Add ChoreRewards to your home screen for quick access and a native app experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Chrome/Android Instructions */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4" />
                <span className="font-medium">On Android (Chrome)</span>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Tap the menu button (⋮) in your browser</li>
                <li>Select "Add to Home screen"</li>
                <li>Choose a name and tap "Add"</li>
              </ol>
            </div>

            {/* iOS Instructions */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4" />
                <span className="font-medium">On iOS (Safari)</span>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mb-2">
                <p className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">
                  ⚠️ Push notifications only work when installed on iPhone/iPad!
                </p>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Tap the Share button (□↗)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Choose a name and tap "Add"</li>
              </ol>
            </div>

            {/* Desktop Instructions */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4" />
                <span className="font-medium">On Desktop</span>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Click the install icon in your address bar</li>
                <li>Or use your browser's menu to "Install ChoreRewards"</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Maybe Later
            </Button>
            <Button onClick={() => setShowDialog(false)}>
              Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}