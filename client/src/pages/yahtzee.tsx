import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, RotateCcw } from "lucide-react";

interface YahtzeeGame {
  id: string;
  dice: string;
  heldDice: string;
  rollsRemaining: number;
  scorecard: string;
  yahtzeeBonus: number;
  status: string;
}

interface Scorecard {
  ones: number | null;
  twos: number | null;
  threes: number | null;
  fours: number | null;
  fives: number | null;
  sixes: number | null;
  threeOfAKind: number | null;
  fourOfAKind: number | null;
  fullHouse: number | null;
  smallStraight: number | null;
  largeStraight: number | null;
  yahtzee: number | null;
  chance: number | null;
}

const categoryNames: Record<keyof Scorecard, string> = {
  ones: "Ones",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  threeOfAKind: "Three of a Kind",
  fourOfAKind: "Four of a Kind",
  fullHouse: "Full House (25)",
  smallStraight: "Small Straight (30)",
  largeStraight: "Large Straight (40)",
  yahtzee: "Yahtzee (50)",
  chance: "Chance",
};

const DiceIcon = ({ value }: { value: number }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[value - 1] || Dice1;
  return <Icon className="w-12 h-12" />;
};

export default function YahtzeePage() {
  const [heldDice, setHeldDice] = useState<boolean[]>([false, false, false, false, false]);
  const { toast } = useToast();

  const { data: currentGame, isLoading } = useQuery<YahtzeeGame>({
    queryKey: ["/api/yahtzee/current"],
  });

  const startGame = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/yahtzee/start", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yahtzee/current"] });
      setHeldDice([false, false, false, false, false]);
      toast({
        title: "New game started!",
        description: "Roll the dice to begin",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    },
  });

  const rollDice = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/yahtzee/roll", {
        gameId: currentGame!.id,
        heldDice,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Sync heldDice state from server response
      const serverHeldDice = JSON.parse(data.heldDice) as boolean[];
      setHeldDice(serverHeldDice);
      queryClient.invalidateQueries({ queryKey: ["/api/yahtzee/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to roll dice",
        variant: "destructive",
      });
    },
  });

  const scoreCategory = useMutation({
    mutationFn: async (category: keyof Scorecard) => {
      const response = await apiRequest("POST", "/api/yahtzee/score", {
        gameId: currentGame!.id,
        category,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Sync heldDice state from server response
      const serverHeldDice = JSON.parse(data.game.heldDice) as boolean[];
      setHeldDice(serverHeldDice);
      
      queryClient.invalidateQueries({ queryKey: ["/api/yahtzee/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (data.gameComplete) {
        toast({
          title: "🎉 Game Complete!",
          description: `Final Score: ${data.game.finalScore} (+${data.game.pointsAwarded} points)`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to score category",
        variant: "destructive",
      });
    },
  });

  const toggleHold = (index: number) => {
    if (!currentGame) return;
    const newHeldDice = [...heldDice];
    newHeldDice[index] = !newHeldDice[index];
    setHeldDice(newHeldDice);
  };

  const handleRoll = () => {
    if (!currentGame) return;
    rollDice.mutate();
  };

  const handleScore = (category: keyof Scorecard) => {
    if (!currentGame) return;
    scoreCategory.mutate(category);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-yellow-500" size={28} />
              Yahtzee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Play Yahtzee and earn points! Roll dice, choose categories, and score big.
              You earn 1 point for every 10 points you score in the game.
            </p>
            <Button
              onClick={() => startGame.mutate()}
              disabled={startGame.isPending}
              size="lg"
              className="w-full"
              data-testid="button-start-yahtzee"
            >
              Start New Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dice = JSON.parse(currentGame.dice) as number[];
  const scorecard = JSON.parse(currentGame.scorecard) as Scorecard;

  const calculateUpperBonus = () => {
    const upperTotal =
      (scorecard.ones || 0) +
      (scorecard.twos || 0) +
      (scorecard.threes || 0) +
      (scorecard.fours || 0) +
      (scorecard.fives || 0) +
      (scorecard.sixes || 0);
    return upperTotal >= 63 ? 35 : 0;
  };

  const calculateTotal = () => {
    const yahtzeeBonus = currentGame.yahtzeeBonus || 0;
    return (
      Object.values(scorecard).reduce((sum, val) => sum + (val || 0), 0) +
      calculateUpperBonus() +
      (yahtzeeBonus * 100) // Each bonus Yahtzee is worth 100 points
    );
  };

  const calculatePotentialScore = (category: keyof Scorecard): number => {
    // Simple calculation - in real app would use backend logic
    switch (category) {
      case 'ones': return dice.filter(d => d === 1).reduce((s, d) => s + d, 0);
      case 'twos': return dice.filter(d => d === 2).reduce((s, d) => s + d, 0);
      case 'threes': return dice.filter(d => d === 3).reduce((s, d) => s + d, 0);
      case 'fours': return dice.filter(d => d === 4).reduce((s, d) => s + d, 0);
      case 'fives': return dice.filter(d => d === 5).reduce((s, d) => s + d, 0);
      case 'sixes': return dice.filter(d => d === 6).reduce((s, d) => s + d, 0);
      case 'chance': return dice.reduce((s, d) => s + d, 0);
      default: return 0;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dice Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Yahtzee
              </span>
              <span className="text-sm font-normal">
                Rolls: {currentGame.rollsRemaining}/2
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dice Display */}
            <div className="flex justify-center gap-3">
              {dice.map((value, index) => (
                <button
                  key={index}
                  onClick={() => toggleHold(index)}
                  className={`p-3 rounded-lg transition-all cursor-pointer ${
                    heldDice[index]
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                  data-testid={`dice-${index}`}
                >
                  <DiceIcon value={value} />
                  {heldDice[index] && (
                    <div className="text-xs mt-1 font-bold">HELD</div>
                  )}
                </button>
              ))}
            </div>

            {/* Roll Button */}
            <Button
              onClick={handleRoll}
              disabled={currentGame.rollsRemaining === 0 || rollDice.isPending}
              size="lg"
              className="w-full"
              data-testid="button-roll-dice"
            >
              <RotateCcw className="mr-2" />
              Roll Dice {currentGame.rollsRemaining > 0 && `(${currentGame.rollsRemaining} left)`}
            </Button>

            {currentGame.rollsRemaining === 0 && (
              <p className="text-sm text-center text-muted-foreground">
                No rolls remaining. Choose a category to score.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Scorecard Section */}
        <Card>
          <CardHeader>
            <CardTitle>Scorecard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Upper Section */}
              <div className="font-bold text-sm mb-2 text-muted-foreground">Upper Section</div>
              {(['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => handleScore(category)}
                  disabled={scorecard[category] !== null || scoreCategory.isPending}
                  className={`w-full flex justify-between items-center p-2 rounded hover:bg-secondary transition-colors ${
                    scorecard[category] !== null ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  data-testid={`category-${category}`}
                >
                  <span>{categoryNames[category]}</span>
                  <span className="font-mono">
                    {scorecard[category] !== null ? (
                      scorecard[category]
                    ) : (
                      <span className="text-muted-foreground">
                        {calculatePotentialScore(category)}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              
              <div className="flex justify-between p-2 bg-secondary/50 rounded font-bold">
                <span>Bonus (if ≥63)</span>
                <span>{calculateUpperBonus()}</span>
              </div>

              {/* Lower Section */}
              <div className="font-bold text-sm mt-4 mb-2 text-muted-foreground">Lower Section</div>
              {(['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => handleScore(category)}
                  disabled={scorecard[category] !== null || scoreCategory.isPending}
                  className={`w-full flex justify-between items-center p-2 rounded hover:bg-secondary transition-colors ${
                    scorecard[category] !== null ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  data-testid={`category-${category}`}
                >
                  <span>{categoryNames[category]}</span>
                  <span className="font-mono">
                    {scorecard[category] !== null ? scorecard[category] : "—"}
                  </span>
                </button>
              ))}

              {currentGame.yahtzeeBonus > 0 && (
                <div className="flex justify-between p-2 bg-yellow-500/20 rounded font-bold mt-2">
                  <span>Yahtzee Bonus (×{currentGame.yahtzeeBonus})</span>
                  <span>{currentGame.yahtzeeBonus * 100}</span>
                </div>
              )}

              <div className="flex justify-between p-2 bg-primary/10 rounded font-bold mt-4">
                <span>Total Score</span>
                <span>{calculateTotal()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
