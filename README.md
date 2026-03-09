# CardWise

A credit card recommendation engine that analyzes your actual spending habits and tells you exactly which cards will earn you the most — and shows you the math to prove it.

---

## The Problem

Credit card reward structures are designed to be confusing. A card advertises "5x points on travel" but doesn't tell you that each point is worth half a cent, making it worse than a flat 2% cash back card for most people. Another card offers 4x on dining and 4x on groceries, but charges a $250 annual fee that only makes sense if you spend over $500/month in those categories. The information is out there, but comparing 40+ cards across multipliers, point valuations, annual fees, foreign transaction penalties, and sign-up bonuses is genuinely difficult — even for people who are financially literate.

This hits two groups especially hard.

**People already carrying cards they've never evaluated.** Most adults picked their credit card based on a mailer, a bank teller's suggestion, or whatever their parents told them to get. They're spending $1,500/month on groceries, dining, and gas without realizing a different card would put $400+ more back in their pocket each year. They know optimization is possible but don't have the time or patience to sit down with a spreadsheet and model it out.

**Young people entering the workforce for the first time.** Teens, college students, and recent grads landing their first real jobs are stepping into personal finance with zero context. They don't know what an annual fee is, why foreign transaction fees matter, or that "points" from different issuers are worth wildly different amounts. The credit card world is overwhelming — every comparison site is cluttered with affiliate links and jargon, and most resources assume a baseline knowledge that new earners simply don't have. These are the people most likely to either pick a bad card out of confusion or avoid the decision entirely and miss out on hundreds of dollars in rewards they'd earn from everyday purchases they're already making.

## The Solution

CardWise lets you plug in your real spending numbers and get back concrete, dollar-denominated recommendations — not vague "this card is good for travel" advice.

**How it works:**

1. **Create a session.** Each session is a spending scenario you can test. Want to see how recommendations change if you start cooking more and dining out less? Create two sessions and compare.

2. **Enter your monthly spending** across five categories: groceries, dining, gas, online shopping, and a catch-all "other" bucket. The interface shows you the annualized total as you type so you can gut-check whether the numbers feel right.

3. **Set your travel profile.** Enter your annual travel budget separately, then use a slider to split it between domestic and international. If your international spend is significant, the engine automatically prioritizes cards with no foreign transaction fees and quantifies how much that saves you.

4. **Select your current cards** from a dropdown of 40+ real credit cards. No free-text input — you pick from the same database the engine scores against, which means the comparison math is always apples-to-apples. The annual fee auto-fills so you don't have to look it up.

5. **Get recommendations.** The engine scores every card in the database against your profile and returns the top 5. Each recommendation includes:
   - **Per-category reward breakdown** showing the exact math: your annual spend in that category, the card's multiplier, the point value, and the resulting dollar reward. For example: *"Groceries: $7,200/yr x 4x x $0.02 (pt value) = $576/yr."*
   - **A point value explanation** so you understand what that decimal means — "Each point/mile is worth $0.0200 (2.00 cents)."
   - **Current card comparisons** for every card in your wallet. Each comparison tells you whether to swap, keep both, or stick with your current card, with dollar values for both sides and an explanation of why.
   - **Break-even analysis** showing how much you'd need to spend monthly in the card's strongest category to justify the annual fee.

Sessions are saved to your account, so you can revisit and re-run recommendations as your spending changes.

## Tradeoffs and Decisions

### Splitting spend across duplicate reward tiers instead of using the best multiplier

Some cards have multiple reward entries for the same category. The Chase Sapphire Reserve, for instance, offers 10x on hotels and car rentals booked through Chase Travel *and* 5x on flights booked through Chase Travel — both filed under "travel." The question is: when a user says they spend $6,000/year on travel, how do you allocate that across the two tiers?

The options were:
- **Best multiplier only:** Apply 10x to the entire $6,000. Simple, but overstates the card's value because most people don't spend 100% of their travel budget on hotels.
- **Worst multiplier only:** Apply 5x to everything. Understates the value and penalizes cards with premium tiers.
- **Equal split:** Divide the spend evenly across tiers. Not perfectly accurate for any individual user, but the closest to a reasonable average without asking users to sub-categorize their travel into hotels vs. flights vs. car rentals.

I went with equal split. It's a deliberate trade of individual precision for overall fairness. The alternative — adding sub-category inputs for every split — would make the UI significantly more complex for a marginal accuracy gain. The breakdown section makes this visible: users can see exactly how their spend was allocated and mentally adjust if they know their travel skews heavily toward one sub-category.

### Per-card point valuations instead of treating all points equally

Every credit card in the database has its own `pointValue` — the estimated dollar value of a single point or mile. Amex Membership Rewards points are valued at $0.02 each. Chase Ultimate Rewards at $0.0125–$0.015. Hilton Honors points at $0.005. This matters enormously.

A card offering "12x points on hotels" sounds incredible until you realize each point is worth half a cent, making it effectively 6% back — good, but not the 12% it implies. Without per-card point valuations, a naive engine would rank Hilton's 12x above Amex's 4x, even though Amex's 4x at $0.02/point (8% effective) is objectively more valuable.

The tradeoff is that point valuations are somewhat subjective. A travel hacker who transfers Amex points to airline partners might get $0.03+ per point, while someone redeeming for statement credits gets $0.006. I used consensus transfer valuations from major points-and-miles communities as the baseline. This won't be perfect for power users, but it prevents the engine from recommending cards whose headline multipliers are inflated by low-value points — which is exactly the trap card issuers set.

## What I Learned

**Showing the math builds more trust than hiding it behind a score.** The first version of the recommendation engine returned a single "net annual value" number and a paragraph of text explaining why the card was good. Testers kept asking "but where does that number come from?" Adding the per-category breakdown — where each row shows `$spend x multiplier x point_value = $reward` — eliminated that question entirely. People don't need to verify every line; they just need to *be able to*. The transparency itself is the feature.

**Comparison thresholds need a dead zone, not a hard boundary.** The initial card comparison logic used a simple rule: if the recommended card's net value is higher, advise "swap." But a $10/year difference isn't worth the hassle of applying for a new card, and users flagged it as bad advice. Adding a $100 dead zone — where the advice shifts to "keep both" instead of "swap" — dramatically improved the perceived quality of recommendations. The insight is that decision advice isn't just about which option is mathematically better; it needs to account for the friction cost of acting on it.

**Duplicate reward categories are a silent data modeling problem.** When a card has two entries for "travel" (e.g., 10x hotels + 5x flights), naively iterating over the rewards array and applying each entry to the full category spend double-counts the entire travel budget. This produced absurdly high reward estimates for premium travel cards — the Chase Sapphire Reserve was showing $1,500+ in annual travel rewards on a $5,000 budget, which is a 30% return that obviously doesn't exist. The fix (grouping by category and splitting spend) was straightforward, but the bug was hard to catch because the inflated numbers still looked *plausible* for premium cards. The lesson: when your test data can't obviously distinguish between "correct" and "wrong," you need to validate against real-world baselines, not just check that the code runs.
