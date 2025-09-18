import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertChore, Chore } from "@shared/schema";

interface AddChoreModalProps {
  open: boolean;
  onClose: () => void;
  editChore?: Chore;
}

export default function AddChoreModal({ open, onClose, editChore }: AddChoreModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<InsertChore>({
    name: editChore?.name || "",
    description: editChore?.description || "",
    points: editChore?.points || 50,
    estimatedTime: editChore?.estimatedTime || "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertChore) => {
      const response = await apiRequest("POST", "/api/chores", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({
        title: "Chore Created",
        description: "New chore has been added successfully!",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create chore",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertChore) => {
      const response = await apiRequest("PUT", `/api/chores/${editChore!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({
        title: "Chore Updated",
        description: "Chore has been updated successfully!",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update chore",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editChore) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      points: 50,
      estimatedTime: "",
    });
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editChore ? "Edit Chore" : "Add New Chore"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Chore Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter chore name"
              required
              data-testid="input-chore-name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the chore..."
              className="h-20"
              data-testid="input-chore-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="points">Point Value</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                placeholder="50"
                min="1"
                required
                data-testid="input-chore-points"
              />
            </div>
            <div>
              <Label htmlFor="estimatedTime">Estimated Time</Label>
              <Input
                id="estimatedTime"
                value={formData.estimatedTime || ""}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                placeholder="30 minutes"
                data-testid="input-chore-time"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
              data-testid="button-cancel-chore"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
              data-testid="button-submit-chore"
            >
              {isLoading ? "Saving..." : editChore ? "Update Chore" : "Create Chore"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
