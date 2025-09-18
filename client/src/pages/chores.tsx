import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, CheckSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChoreCard from "@/components/chore-card";
import AddChoreModal from "@/components/add-chore-modal";
import CelebrationOverlay from "@/components/celebration-overlay";
import type { Chore } from "@shared/schema";

export default function Chores() {
  const [showAddChore, setShowAddChore] = useState(false);
  const [editChore, setEditChore] = useState<Chore | undefined>();
  const [celebrationData, setCelebrationData] = useState<{ show: boolean; points: number; newBalance: number }>({ 
    show: false, 
    points: 0, 
    newBalance: 0 
  });

  const { data: chores = [] } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });

  const pendingChores = chores.filter(chore => !chore.isCompleted);
  const completedChores = chores.filter(chore => chore.isCompleted);

  const handleChoreComplete = (points: number, newBalance: number) => {
    setCelebrationData({ show: true, points, newBalance });
  };

  const handleEditChore = (chore: Chore) => {
    setEditChore(chore);
    setShowAddChore(true);
  };

  const handleCloseModal = () => {
    setShowAddChore(false);
    setEditChore(undefined);
  };

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Chores</h1>
            <p className="text-muted-foreground">Manage your tasks and earn points</p>
          </div>
          <Button onClick={() => setShowAddChore(true)} data-testid="button-add-chore">
            <Plus className="mr-2" size={16} />
            Add Chore
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <Clock size={16} />
              <span>Pending ({pendingChores.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center space-x-2">
              <CheckSquare size={16} />
              <span>Completed ({completedChores.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingChores.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckSquare className="mx-auto mb-4 text-muted-foreground" size={64} />
                  <h3 className="text-xl font-semibold mb-2">No pending chores</h3>
                  <p className="text-muted-foreground mb-6">
                    Great job! You've completed all your chores. Add new ones to keep earning points.
                  </p>
                  <Button onClick={() => setShowAddChore(true)}>
                    <Plus className="mr-2" size={16} />
                    Add Your First Chore
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pendingChores.map(chore => (
                <ChoreCard 
                  key={chore.id} 
                  chore={chore} 
                  onComplete={handleChoreComplete}
                  onEdit={handleEditChore}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedChores.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="mx-auto mb-4 text-muted-foreground" size={64} />
                  <h3 className="text-xl font-semibold mb-2">No completed chores yet</h3>
                  <p className="text-muted-foreground">
                    Complete some chores to see your achievements here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedChores.map(chore => (
                <ChoreCard key={chore.id} chore={chore} showActions={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AddChoreModal 
        open={showAddChore} 
        onClose={handleCloseModal}
        editChore={editChore}
      />

      <CelebrationOverlay 
        show={celebrationData.show}
        points={celebrationData.points}
        newBalance={celebrationData.newBalance}
        onClose={() => setCelebrationData({ show: false, points: 0, newBalance: 0 })}
      />
    </>
  );
}
