import type { SpendingSession, CardRecommendation, CreditCardData, CurrentCard } from "@shared/schema";
import { creditCards } from "./creditCards";

export function generateRecommendations(session: SpendingSession): CardRecommendation[] {
  const annualSpending = {
    groceries: session.monthlyGroceries * 12,
    dining: session.monthlyDining * 12,
    travel: session.monthlyTravel * 12 + session.annualTravelBudget,
    gas: session.monthlyGas * 12,
    online: session.monthlyOnline * 12,
    other: session.monthlyOther * 12,
  };

  const totalAnnual = Object.values(annualSpending).reduce((s, v) => s + v, 0);
  const internationalSpend = session.annualTravelBudget * (session.internationalTravelPercent / 100);
  const heavyInternational = session.internationalTravelPercent >= 30 && internationalSpend > 1000;

  const currentCardNames = (session.currentCards || []).map((c) => c.name.toLowerCase());

  const scored: CardRecommendation[] = creditCards.map((card) => {
    let estimatedRewards = 0;
    const breakEven: Record<string, number> = {};

    for (const reward of card.rewards) {
      let spend = 0;
      switch (reward.category) {
        case "groceries":
          spend = annualSpending.groceries;
          break;
        case "dining":
          spend = annualSpending.dining;
          break;
        case "travel":
          spend = annualSpending.travel;
          break;
        case "gas":
          spend = annualSpending.gas;
          break;
        case "online":
          spend = annualSpending.online;
          break;
        case "rotating":
          spend = Math.min(totalAnnual * 0.15, 6000);
          break;
        case "other":
          spend = annualSpending.other;
          break;
        default:
          spend = 0;
      }
      estimatedRewards += spend * reward.multiplier * card.pointValue;
    }

    let foreignTxPenalty = 0;
    if (!card.noForeignTransactionFee && internationalSpend > 0) {
      foreignTxPenalty = internationalSpend * 0.03;
    }

    let noFtfBonus = 0;
    if (card.noForeignTransactionFee && heavyInternational) {
      noFtfBonus = internationalSpend * 0.03;
    }

    const netAnnualValue = estimatedRewards - card.annualFee - foreignTxPenalty + noFtfBonus;

    if (card.annualFee > 0) {
      const topCategory = card.rewards.reduce(
        (best, r) => (r.multiplier > best.multiplier && r.category !== "other" ? r : best),
        card.rewards[0],
      );
      if (topCategory && topCategory.multiplier > 1) {
        const monthlyNeeded = card.annualFee / (topCategory.multiplier * card.pointValue * 12);
        breakEven[topCategory.category] = Math.round(monthlyNeeded);
      }
    }

    let score = netAnnualValue;

    if (heavyInternational && card.noForeignTransactionFee) {
      score += 100;
    }
    if (heavyInternational && !card.noForeignTransactionFee) {
      score -= 80;
    }

    if (annualSpending.groceries > 4000 && card.rewards.some((r) => r.category === "groceries" && r.multiplier >= 4)) {
      score += 50;
    }
    if (annualSpending.dining > 3000 && card.rewards.some((r) => r.category === "dining" && r.multiplier >= 3)) {
      score += 50;
    }
    if (annualSpending.travel > 5000 && card.rewards.some((r) => r.category === "travel" && r.multiplier >= 5)) {
      score += 60;
    }

    let action: "new" | "upgrade" | "swap" | "keep" = "new";
    let actionExplanation: string | undefined;

    const isCurrentCard = currentCardNames.some((cn) => card.name.toLowerCase().includes(cn) || cn.includes(card.name.toLowerCase()));

    if (isCurrentCard) {
      if (netAnnualValue > 0) {
        action = "keep";
        actionExplanation = `This card is already in your wallet and earning you an estimated $${estimatedRewards.toFixed(0)} in annual rewards, which exceeds the $${card.annualFee} annual fee.`;
      } else {
        action = "swap";
        actionExplanation = `Consider replacing this card. The $${card.annualFee} annual fee outweighs the estimated $${estimatedRewards.toFixed(0)} in rewards based on your spending.`;
      }
    } else {
      const upgradableCards = (session.currentCards || []).filter((cc) => {
        const sameIssuer = card.issuer.toLowerCase().includes(cc.name.split(" ")[0].toLowerCase());
        return sameIssuer && card.annualFee > cc.annualFee;
      });

      if (upgradableCards.length > 0) {
        action = "upgrade";
        const from = upgradableCards[0];
        actionExplanation = `Upgrade from your ${from.name} ($${from.annualFee}/yr) to unlock better rewards. The additional $${card.annualFee - from.annualFee}/yr in fees should be offset by $${(estimatedRewards - from.annualFee).toFixed(0)} more in annual rewards.`;
      }
    }

    const whyRecommended = buildExplanation(card, annualSpending, heavyInternational, netAnnualValue, estimatedRewards);

    return {
      cardName: card.name,
      issuer: card.issuer,
      annualFee: card.annualFee,
      signUpBonus: card.signUpBonus,
      signUpSpendRequirement: card.signUpSpendRequirement,
      signUpTimeframe: card.signUpTimeframe,
      rewardsBreakdown: card.rewards,
      estimatedAnnualRewards: estimatedRewards,
      netAnnualValue,
      noForeignTransactionFee: card.noForeignTransactionFee,
      whyRecommended,
      breakEvenSpending: breakEven,
      action,
      actionExplanation,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 5);
}

function buildExplanation(
  card: CreditCardData,
  spending: Record<string, number>,
  heavyInternational: boolean,
  netValue: number,
  rewards: number,
): string {
  const parts: string[] = [];

  const topRewards = card.rewards
    .filter((r) => r.multiplier > 1 && r.category !== "other")
    .sort((a, b) => b.multiplier - a.multiplier);

  if (topRewards.length > 0) {
    const topCategories = topRewards.slice(0, 2).map((r) => `${r.multiplier}x on ${r.category}`).join(" and ");
    parts.push(`Strong earning potential with ${topCategories}.`);
  }

  if (card.noForeignTransactionFee && heavyInternational) {
    parts.push("No foreign transaction fees save you ~3% on international purchases.");
  }

  if (netValue > 200) {
    parts.push(`Estimated net annual value of $${netValue.toFixed(0)} after the $${card.annualFee} fee.`);
  } else if (netValue > 0) {
    parts.push(`The $${card.annualFee} annual fee is more than covered by your estimated $${rewards.toFixed(0)} in rewards.`);
  } else if (card.annualFee === 0) {
    parts.push("No annual fee means every dollar of rewards is pure profit.");
  }

  const highSpendCategories = Object.entries(spending)
    .filter(([_, v]) => v > 3000)
    .map(([k]) => k);

  const matchingHighSpend = topRewards.filter((r) => highSpendCategories.includes(r.category));
  if (matchingHighSpend.length > 0) {
    const cats = matchingHighSpend.map((r) => r.category).join(", ");
    parts.push(`Aligns well with your high spending in ${cats}.`);
  }

  return parts.join(" ") || `A solid choice with $${rewards.toFixed(0)} in estimated annual rewards.`;
}
