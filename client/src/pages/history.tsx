import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon, Plus, Gift, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";

export default function History() {
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: { points: number } | undefined };

  const totalEarned = transactions
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'spend')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground">Track your points and see your progress</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{user?.points?.toLocaleString() ?? 0}</div>
            <div className="text-xs text-muted-foreground">points</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{totalEarned.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">points</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{totalSpent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">points</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <div className="text-xs text-muted-foreground">total</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HistoryIcon size={20} />
            <span>All Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <HistoryIcon className="mx-auto mb-4 text-muted-foreground" size={64} />
              <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground">
                Complete chores or claim rewards to see your transaction history.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      transaction.type === 'earn' 
                        ? 'bg-chart-1/20' 
                        : 'bg-chart-2/20'
                    }`}>
                      {transaction.type === 'earn' ? (
                        <Plus className="text-chart-1" size={20} />
                      ) : (
                        <Gift className="text-chart-2" size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{transaction.description}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar size={14} />
                        <span>{formatDate(transaction.createdAt!)}</span>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type === 'earn' ? 'Earned' : 'Spent'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      transaction.type === 'earn' 
                        ? 'text-chart-1' 
                        : 'text-chart-2'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                    </span>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
