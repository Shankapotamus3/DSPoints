import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chore } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface AdminApprovalModalProps {
  pendingChores: Chore[];
  trigger?: React.ReactNode;
}

export default function AdminApprovalModal({ pendingChores, trigger }: AdminApprovalModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ choreId, comment }: { choreId: string; comment?: string }) => {
      const response = await apiRequest("POST", `/api/chores/${choreId}/approve`, {
        comment,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chores/pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Chore Approved! ✅",
        description: "The chore has been approved and points have been awarded.",
      });
      setSelectedChore(null);
      setComment("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve chore",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ choreId, comment }: { choreId: string; comment?: string }) => {
      const response = await apiRequest("POST", `/api/chores/${choreId}/reject`, {
        comment,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chores/pending-approval"] });
      toast({
        title: "Chore Rejected",
        description: "The chore has been rejected with feedback.",
      });
      setSelectedChore(null);
      setComment("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject chore",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (choreId: string) => {
    approveMutation.mutate({ choreId, comment: comment.trim() || undefined });
  };

  const handleReject = (choreId: string) => {
    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejecting this chore.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ choreId, comment: comment.trim() });
  };

  const getChoreIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('clean') || lower.includes('vacuum')) return "🧹";
    if (lower.includes('dish') || lower.includes('kitchen')) return "🍽️";
    if (lower.includes('trash') || lower.includes('garbage')) return "🗑️";
    if (lower.includes('laundry')) return "👕";
    if (lower.includes('garden') || lower.includes('yard')) return "🌱";
    return "✨";
  };

  const defaultTrigger = (
    <Button variant="outline" data-testid="button-admin-approval">
      <MessageCircle className="mr-2" size={16} />
      Review Pending ({pendingChores.length})
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Chore Approval Center</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[60vh]">
          {/* Pending Chores List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pending Approval ({pendingChores.length})</h3>
            <ScrollArea className="h-full">
              {pendingChores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No chores pending approval</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChores.map((chore) => (
                    <Card
                      key={chore.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedChore?.id === chore.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedChore(chore)}
                      data-testid={`chore-approval-item-${chore.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-sm">{getChoreIcon(chore.name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{chore.name}</h4>
                            {chore.description && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {chore.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                🪙 {chore.points}
                              </Badge>
                              {chore.completedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(chore.completedAt), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Approval Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Approval Actions</h3>
            {selectedChore ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <span className="text-lg">{getChoreIcon(selectedChore.name)}</span>
                    <span>{selectedChore.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedChore.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedChore.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Points</Label>
                      <p className="text-sm">🪙 {selectedChore.points}</p>
                    </div>
                    {selectedChore.completedAt && (
                      <div>
                        <Label className="text-sm font-medium">Completed</Label>
                        <p className="text-sm">
                          {formatDistanceToNow(new Date(selectedChore.completedAt), { addSuffix: true })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approval-comment">Comment (optional for approval, required for rejection)</Label>
                    <Textarea
                      id="approval-comment"
                      placeholder="Add a comment about the chore completion..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[80px]"
                      data-testid="textarea-approval-comment"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApprove(selectedChore.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid="button-approve-selected"
                    >
                      <CheckCircle className="mr-2" size={16} />
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedChore.id)}
                      disabled={rejectMutation.isPending}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      data-testid="button-reject-selected"
                    >
                      <XCircle className="mr-2" size={16} />
                      {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a chore to review</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}