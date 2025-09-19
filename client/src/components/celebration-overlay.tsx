import { useEffect } from "react";

interface CelebrationOverlayProps {
  show: boolean;
  points?: number;
  newBalance?: number;
  type: 'completion' | 'approval';
  onClose: () => void;
}

export default function CelebrationOverlay({ show, points, newBalance, type, onClose }: CelebrationOverlayProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-center celebration-bounce">
        <div className="text-6xl mb-4">{type === 'approval' ? '🎉' : '📝'}</div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg pointer-events-auto">
          {type === 'completion' ? (
            <>
              <h3 className="text-2xl font-bold text-primary mb-2">Chore Submitted!</h3>
              <p className="text-muted-foreground mb-4">
                Your chore has been submitted for approval
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <span>⏳ Waiting for admin approval</span>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-primary mb-2">Chore Approved!</h3>
              <p className="text-muted-foreground mb-4">
                You earned <span className="font-bold text-accent">{points} points</span>
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <span>New balance:</span>
                <span className="font-semibold text-foreground">{newBalance?.toLocaleString()} points</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
