import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, CreditCard, ShoppingCart, Utensils, Plane, Fuel, Globe, Package,
  DollarSign, TrendingUp, TrendingDown, ArrowRightLeft, Check, Sparkles, Sun, Moon, Plus, X, RefreshCw, ArrowRight,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useTheme } from "@/lib/theme-provider";
import type { SpendingSession, CurrentCard, CardRecommendation, CreditCardData } from "@shared/schema";
import { useState, useEffect } from "react";

const spendingCategories = [
  { key: "monthlyGroceries", label: "Groceries", icon: ShoppingCart, color: "text-chart-5" },
  { key: "monthlyDining", label: "Dining Out", icon: Utensils, color: "text-chart-4" },
  { key: "monthlyTravel", label: "Travel", icon: Plane, color: "text-primary" },
  { key: "monthlyGas", label: "Gas", icon: Fuel, color: "text-chart-3" },
  { key: "monthlyOnline", label: "Online Shopping", icon: Package, color: "text-chart-2" },
  { key: "monthlyOther", label: "Other", icon: DollarSign, color: "text-muted-foreground" },
] as const;

const categoryLabels: Record<string, string> = {
  groceries: "Groceries",
  dining: "Dining",
  travel: "Travel",
  gas: "Gas",
  online: "Online",
  other: "Other",
  rotating: "Rotating Categories",
};

function RecommendationCard({ rec, index }: { rec: CardRecommendation; index: number }) {
  const actionColors: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: "bg-primary/10", text: "text-primary", label: "New Card" },
    upgrade: { bg: "bg-chart-5/10", text: "text-chart-5", label: "Upgrade" },
    swap: { bg: "bg-chart-4/10", text: "text-chart-4", label: "Swap" },
    keep: { bg: "bg-chart-2/10", text: "text-chart-2", label: "Keep" },
  };
  const actionStyle = actionColors[rec.action] || actionColors.new;

  const actionIcons: Record<string, typeof TrendingUp> = {
    new: Sparkles,
    upgrade: TrendingUp,
    swap: ArrowRightLeft,
    keep: Check,
  };
  const ActionIcon = actionIcons[rec.action] || Sparkles;

  const comparisonAdviceStyles: Record<string, { bg: string; text: string; label: string }> = {
    "swap": { bg: "bg-amber-500/10", text: "text-amber-500", label: "Swap" },
    "keep-both": { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Keep Both" },
    "current-is-better": { bg: "bg-blue-500/10", text: "text-blue-500", label: "Current is Better" },
  };

  const visibleBreakdown = (rec.categoryBreakdown || []).filter((b) => b.rewardValue > 0);

  return (
    <Card className={index === 0 ? "border-primary/30" : ""} data-testid={`card-recommendation-${index}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {index === 0 && (
                <Badge variant="default" className="text-xs">
                  Top Pick
                </Badge>
              )}
              <Badge variant="secondary" className={`text-xs ${actionStyle.bg} ${actionStyle.text} border-0`}>
                <ActionIcon className="w-3 h-3 mr-1" />
                {actionStyle.label}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg" data-testid={`text-card-name-${index}`}>{rec.cardName}</h3>
            <p className="text-sm text-muted-foreground">{rec.issuer}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-primary" data-testid={`text-net-value-${index}`}>
              ${rec.netAnnualValue.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">net value/yr</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2.5 rounded-md bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Annual Fee</p>
            <p className="font-bold text-sm">${rec.annualFee}</p>
          </div>
          <div className="p-2.5 rounded-md bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rewards</p>
            <p className="font-bold text-sm text-chart-5">${rec.estimatedAnnualRewards.toFixed(0)}</p>
          </div>
          <div className="p-2.5 rounded-md bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Intl Fee</p>
            <p className="font-bold text-sm">{rec.noForeignTransactionFee ? "None" : "3%"}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Rewards Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {rec.rewardsBreakdown.map((r, i) => (
              <div key={i} className="px-2.5 py-1 rounded-md bg-muted/50 text-xs">
                <span className="font-semibold">{r.multiplier}x</span>
                <span className="text-muted-foreground ml-1">{r.category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sign-Up Bonus</p>
          <p className="text-sm">{rec.signUpBonus}</p>
        </div>

        <div className="p-3 rounded-md bg-accent/50 mb-4" data-testid={`section-why-${index}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Why This Card</p>
          {visibleBreakdown.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {visibleBreakdown.map((b, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm" data-testid={`breakdown-row-${index}-${i}`}>
                  <span className="text-muted-foreground capitalize">
                    {categoryLabels[b.category] || b.category}
                  </span>
                  <span className="text-xs text-muted-foreground/70 flex-1 text-right mr-2">
                    ${b.annualSpend.toLocaleString()}/yr x {b.multiplier}x x ${b.pointValue}
                  </span>
                  <span className="font-semibold text-chart-5 shrink-0">
                    ${b.rewardValue.toFixed(0)}/yr
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2 text-sm pt-1.5 border-t border-border/50">
                <span className="font-medium">Total Estimated Rewards</span>
                <span className="font-bold text-primary">${rec.estimatedAnnualRewards.toFixed(0)}/yr</span>
              </div>
              {rec.annualFee > 0 && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Minus Annual Fee</span>
                  <span className="text-muted-foreground">-${rec.annualFee}</span>
                </div>
              )}
            </div>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground" data-testid={`text-why-${index}`}>{rec.whyRecommended}</p>
        </div>

        {rec.currentCardComparisons && rec.currentCardComparisons.length > 0 && (
          <div className="p-3 rounded-md bg-muted/30 mb-4" data-testid={`section-comparisons-${index}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Your Cards vs. This Card</p>
            <div className="space-y-3">
              {rec.currentCardComparisons.map((comp, ci) => {
                const adviceStyle = comparisonAdviceStyles[comp.advice] || comparisonAdviceStyles["keep-both"];
                return (
                  <div key={ci} className="p-3 rounded-md bg-background/50 border border-border/30" data-testid={`comparison-${index}-${ci}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{comp.currentCardName}</span>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${adviceStyle.bg} ${adviceStyle.text} border-0`}>
                        {adviceStyle.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-xs flex-wrap">
                      <div className="px-2 py-1 rounded bg-muted/50">
                        <span className="text-muted-foreground">Current: </span>
                        <span className="font-semibold">${comp.currentCardValue.toFixed(0)}/yr</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className="px-2 py-1 rounded bg-primary/10">
                        <span className="text-muted-foreground">Recommended: </span>
                        <span className="font-semibold text-primary">${comp.recommendedCardValue.toFixed(0)}/yr</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{comp.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rec.actionExplanation && (
          <div className="p-3 rounded-md bg-muted/50 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {rec.action === "swap" ? "Why Swap" : rec.action === "upgrade" ? "Why Upgrade" : "Action"}
            </p>
            <p className="text-sm leading-relaxed">{rec.actionExplanation}</p>
          </div>
        )}

        {rec.breakEvenSpending && Object.keys(rec.breakEvenSpending).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Break-Even Monthly Spending</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(rec.breakEvenSpending).map(([cat, amount]) => (
                <div key={cat} className="px-2.5 py-1 rounded-md bg-muted/50 text-xs">
                  <span className="capitalize">{cat}:</span>
                  <span className="font-semibold ml-1">${(amount as number).toFixed(0)}/mo</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const { data: session, isLoading } = useQuery<SpendingSession>({
    queryKey: ["/api/sessions", id],
  });

  const { data: allCreditCards } = useQuery<CreditCardData[]>({
    queryKey: ["/api/credit-cards"],
  });

  const [formData, setFormData] = useState({
    monthlyGroceries: 0,
    monthlyDining: 0,
    monthlyTravel: 0,
    monthlyGas: 0,
    monthlyOnline: 0,
    monthlyOther: 0,
    annualTravelBudget: 0,
    domesticTravelPercent: 70,
    internationalTravelPercent: 30,
    currentCards: [] as CurrentCard[],
  });

  const [selectedCardName, setSelectedCardName] = useState("");
  const [activeTab, setActiveTab] = useState("spending");

  useEffect(() => {
    if (session) {
      setFormData({
        monthlyGroceries: session.monthlyGroceries,
        monthlyDining: session.monthlyDining,
        monthlyTravel: session.monthlyTravel,
        monthlyGas: session.monthlyGas,
        monthlyOnline: session.monthlyOnline,
        monthlyOther: session.monthlyOther,
        annualTravelBudget: session.annualTravelBudget,
        domesticTravelPercent: session.domesticTravelPercent,
        internationalTravelPercent: session.internationalTravelPercent,
        currentCards: session.currentCards || [],
      });
    }
  }, [session]);

  const updateSession = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("PATCH", `/api/sessions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Session saved" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to save session", variant: "destructive" });
    },
  });

  const generateRecs = useMutation({
    mutationFn: async () => {
      await updateSession.mutateAsync(formData);
      const res = await apiRequest("POST", `/api/sessions/${id}/recommend`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", id] });
      setActiveTab("results");
      toast({ title: "Recommendations generated" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to generate recommendations", variant: "destructive" });
    },
  });

  const updateField = (key: string, value: number) => {
    if (key === "domesticTravelPercent") {
      setFormData((prev) => ({ ...prev, domesticTravelPercent: value, internationalTravelPercent: 100 - value }));
    } else if (key === "internationalTravelPercent") {
      setFormData((prev) => ({ ...prev, internationalTravelPercent: value, domesticTravelPercent: 100 - value }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };

  const addCurrentCard = () => {
    if (!selectedCardName) return;
    const cardData = allCreditCards?.find((c) => c.name === selectedCardName);
    if (!cardData) return;
    const alreadyAdded = formData.currentCards.some((c) => c.name === cardData.name);
    if (alreadyAdded) return;
    setFormData((prev) => ({
      ...prev,
      currentCards: [...prev.currentCards, { name: cardData.name, annualFee: cardData.annualFee, category: cardData.category }],
    }));
    setSelectedCardName("");
  };

  const removeCurrentCard = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      currentCards: prev.currentCards.filter((_, i) => i !== index),
    }));
  };

  const availableCards = (allCreditCards || []).filter(
    (c) => !formData.currentCards.some((cc) => cc.name === c.name)
  );

  const totalMonthly = formData.monthlyGroceries + formData.monthlyDining + formData.monthlyTravel + formData.monthlyGas + formData.monthlyOnline + formData.monthlyOther;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Session not found</p>
            <Button onClick={() => navigate("/")} data-testid="button-go-home">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold" data-testid="text-session-title">{session.name}</h1>
              <p className="text-xs text-muted-foreground">${totalMonthly.toLocaleString()}/mo total spending</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle-session">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => generateRecs.mutate()}
              disabled={generateRecs.isPending}
              data-testid="button-generate"
            >
              {generateRecs.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="spending" data-testid="tab-spending">Spending</TabsTrigger>
            <TabsTrigger value="travel" data-testid="tab-travel">Travel</TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">Current Cards</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">
              Results
              {session.recommendations && session.recommendations.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {session.recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {spendingCategories.map(({ key, label, icon: Icon, color }) => (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-md bg-muted/50 flex items-center justify-center ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <Label className="font-medium">{label}</Label>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        value={formData[key] || ""}
                        onChange={(e) => updateField(key, Number(e.target.value) || 0)}
                        className="pl-8"
                        placeholder="0"
                        data-testid={`input-${key}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">${((formData[key] || 0) * 12).toLocaleString()}/year</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">Total Monthly Spending</p>
                    <p className="text-sm text-muted-foreground">Across all categories</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary" data-testid="text-total-monthly">${totalMonthly.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">${(totalMonthly * 12).toLocaleString()}/year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="travel" className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-6">
                <div>
                  <Label className="font-medium mb-3 block">Annual Travel Budget</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      value={formData.annualTravelBudget || ""}
                      onChange={(e) => updateField("annualTravelBudget", Number(e.target.value) || 0)}
                      className="pl-8"
                      placeholder="0"
                      data-testid="input-annual-travel"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Total predicted travel spending for the year</p>
                </div>

                <div className="space-y-4">
                  <Label className="font-medium block">Travel Split</Label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Domestic</span>
                      <span className="text-sm text-primary font-bold" data-testid="text-domestic-pct">{formData.domesticTravelPercent}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-chart-2" />
                      <span className="text-sm font-medium">International</span>
                      <span className="text-sm text-chart-2 font-bold" data-testid="text-intl-pct">{formData.internationalTravelPercent}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[formData.domesticTravelPercent]}
                    onValueChange={([v]) => updateField("domesticTravelPercent", v)}
                    max={100}
                    min={0}
                    step={5}
                    data-testid="slider-travel-split"
                  />
                  <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                    <span>100% Domestic</span>
                    <span>100% International</span>
                  </div>
                </div>

                {formData.internationalTravelPercent >= 30 && (
                  <div className="p-3 rounded-md bg-chart-2/10">
                    <p className="text-sm text-chart-2 font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Significant international travel detected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll prioritize cards with no foreign transaction fees to save you ~3% on international purchases.
                    </p>
                  </div>
                )}

                {formData.annualTravelBudget > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-0.5">Domestic Budget</p>
                      <p className="font-bold">${((formData.annualTravelBudget * formData.domesticTravelPercent) / 100).toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-0.5">International Budget</p>
                      <p className="font-bold">${((formData.annualTravelBudget * formData.internationalTravelPercent) / 100).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <Label className="font-medium mb-3 block">Add Current Credit Card</Label>
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Select a Card</Label>
                    <Select value={selectedCardName} onValueChange={(val) => setSelectedCardName(val)} data-testid="select-card-dropdown">
                      <SelectTrigger data-testid="select-card-trigger">
                        <SelectValue placeholder="Choose a credit card..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCards.map((card) => (
                          <SelectItem key={card.name} value={card.name} data-testid={`select-card-option-${card.name}`}>
                            <span>{card.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">({card.issuer} - ${card.annualFee}/yr)</span>
                          </SelectItem>
                        ))}
                        {availableCards.length === 0 && (
                          <SelectItem value="__none__" disabled>All cards have been added</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedCardName && (
                    <div className="w-32">
                      <Label className="text-xs text-muted-foreground mb-1 block">Annual Fee</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={allCreditCards?.find((c) => c.name === selectedCardName)?.annualFee ?? 0}
                          readOnly
                          className="pl-8 bg-muted/30"
                          data-testid="input-card-fee"
                        />
                      </div>
                    </div>
                  )}
                  <Button onClick={addCurrentCard} disabled={!selectedCardName} data-testid="button-add-card">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {formData.currentCards.length > 0 ? (
              <div className="space-y-2">
                {formData.currentCards.map((card, i) => (
                  <Card key={i} data-testid={`card-current-${i}`}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-muted/50 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-current-card-${i}`}>{card.name}</p>
                          <p className="text-xs text-muted-foreground">${card.annualFee}/year fee</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeCurrentCard(i)} data-testid={`button-remove-card-${i}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <p className="text-xs text-muted-foreground">
                  Total annual fees: ${formData.currentCards.reduce((sum, c) => sum + c.annualFee, 0)}
                </p>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-1">No current cards added</p>
                  <p className="text-xs text-muted-foreground">Add your existing cards to get swap/upgrade recommendations</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results">
            {session.recommendations && session.recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold">Your Recommendations</h2>
                    <p className="text-sm text-muted-foreground">{session.recommendations.length} cards analyzed for your profile</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => generateRecs.mutate()}
                    disabled={generateRecs.isPending}
                    data-testid="button-regenerate"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generateRecs.isPending ? "animate-spin" : ""}`} />
                    Re-analyze
                  </Button>
                </div>
                {session.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} index={i} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Fill in your spending details and travel plans, then click "Get Recommendations" to see your personalized results.
                  </p>
                  <Button onClick={() => setActiveTab("spending")} data-testid="button-go-to-spending">
                    Start with Spending
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
