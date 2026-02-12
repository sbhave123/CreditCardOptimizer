import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, CreditCard, BarChart3, TrendingUp, Trash2, Pencil, Copy, Clock, Sun, Moon } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme-provider";
import type { SpendingSession } from "@shared/schema";
import { useState } from "react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [newSessionName, setNewSessionName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sessions, isLoading } = useQuery<SpendingSession[]>({
    queryKey: ["/api/sessions"],
  });

  const createSession = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/sessions", { name });
      return res.json();
    },
    onSuccess: (data: SpendingSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setDialogOpen(false);
      setNewSessionName("");
      navigate(`/session/${data.id}`);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to create session", variant: "destructive" });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Session deleted" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete session", variant: "destructive" });
    },
  });

  const duplicateSession = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/sessions/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Session duplicated" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to duplicate session", variant: "destructive" });
    },
  });

  const totalSpending = (s: SpendingSession) =>
    (s.monthlyGroceries + s.monthlyDining + s.monthlyTravel + s.monthlyGas + s.monthlyOnline + s.monthlyOther) * 12;

  const formatCurrency = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">CardWise</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">{firstName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <a href="/api/logout">
              <Button variant="outline" size="sm" data-testid="button-logout">Log out</Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-welcome">Welcome back, {firstName}</h1>
            <p className="text-muted-foreground">Create scenarios to find your best credit card match</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-session">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="session-name">Session Name</Label>
                  <Input
                    id="session-name"
                    placeholder="e.g., Heavy Travel Scenario"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    data-testid="input-session-name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSessionName.trim()) {
                        createSession.mutate(newSessionName.trim());
                      }
                    }}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!newSessionName.trim() || createSession.isPending}
                  onClick={() => createSession.mutate(newSessionName.trim())}
                  data-testid="button-create-session"
                >
                  {createSession.isPending ? "Creating..." : "Create Session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="hover-elevate cursor-pointer group"
                onClick={() => navigate(`/session/${session.id}`)}
                data-testid={`card-session-${session.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate" data-testid={`text-session-name-${session.id}`}>{session.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {session.updatedAt ? new Date(session.updatedAt).toLocaleDateString() : "Just now"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap invisible group-hover:visible">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); duplicateSession.mutate(session.id); }}
                        data-testid={`button-duplicate-${session.id}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); deleteSession.mutate(session.id); }}
                        data-testid={`button-delete-${session.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-0.5">Annual Spend</p>
                      <p className="font-bold text-sm" data-testid={`text-annual-spend-${session.id}`}>
                        {formatCurrency(totalSpending(session))}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-0.5">Cards Found</p>
                      <p className="font-bold text-sm" data-testid={`text-cards-found-${session.id}`}>
                        {session.recommendations?.length || 0}
                      </p>
                    </div>
                  </div>

                  {session.recommendations && session.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Top Pick</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-chart-5" />
                        <span className="text-sm font-medium truncate">{session.recommendations[0].cardName}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2" data-testid="text-empty-state">No sessions yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first spending scenario to get personalized credit card recommendations
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-empty-new-session">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Session
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
