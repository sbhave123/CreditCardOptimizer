import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, TrendingUp, Globe, Sparkles, ChevronRight, BarChart3, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg" data-testid="text-app-name">CardWise</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login">Get Started</Button>
          </a>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Smart card recommendations
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight tracking-tight" data-testid="text-hero-title">
              Find the <span className="text-primary">perfect card</span> for your lifestyle
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Stop leaving money on the table. Analyze your spending habits, compare top credit cards, and discover which ones maximize your rewards.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href="/api/login">
                <Button size="lg" data-testid="button-hero-cta">
                  Start Analyzing
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-chart-5" />
                Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-chart-2" />
                15+ top cards analyzed
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-chart-2/10 to-chart-3/10 rounded-2xl blur-3xl" />
            <div className="relative space-y-4">
              <Card className="transform rotate-2 transition-transform duration-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold">Chase Sapphire Preferred</p>
                      <p className="text-sm text-muted-foreground">$95/year</p>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-chart-5/15 text-chart-5 text-xs font-semibold">Best Match</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Travel</p>
                      <p className="font-bold text-primary">5x</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Dining</p>
                      <p className="font-bold text-chart-2">3x</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Other</p>
                      <p className="font-bold text-chart-3">1x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="transform -rotate-1 ml-8 transition-transform duration-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold">Amex Gold Card</p>
                      <p className="text-sm text-muted-foreground">$250/year</p>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-chart-4/15 text-chart-4 text-xs font-semibold">Great for Dining</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Dining</p>
                      <p className="font-bold text-chart-4">4x</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Groceries</p>
                      <p className="font-bold text-chart-2">4x</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Flights</p>
                      <p className="font-bold text-primary">3x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-3" data-testid="text-features-title">How it works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Three simple steps to finding your ideal credit card match</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Enter Your Spending</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Break down your monthly spending across groceries, dining, travel, gas, and more.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-md bg-chart-2/10 flex items-center justify-center mx-auto">
                  <Globe className="w-6 h-6 text-chart-2" />
                </div>
                <h3 className="font-semibold text-lg">Set Travel Plans</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tell us about your travel habits - domestic vs. international - so we factor in transaction fees.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-md bg-chart-3/10 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-chart-3" />
                </div>
                <h3 className="font-semibold text-lg">Get Recommendations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  See which cards maximize your rewards, whether to keep, upgrade, or swap your current cards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>CardWise</span>
          </div>
          <p>Built to help you earn more rewards</p>
        </div>
      </footer>
    </div>
  );
}
