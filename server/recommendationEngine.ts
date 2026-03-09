import type { SpendingSession, CardRecommendation, CreditCardData, CurrentCard, CategoryBreakdown, CurrentCardComparison } from "@shared/schema";
import { creditCards } from "./creditCards";

function getAnnualSpending(session: SpendingSession) {
  return {
    groceries: session.monthlyGroceries * 12,
    dining: session.monthlyDining * 12,
    travel: session.annualTravelBudget,
    gas: session.monthlyGas * 12,
    online: session.monthlyOnline * 12,
    other: session.monthlyOther * 12,
  };
}

function scoreCard(card: CreditCardData, annualSpending: Record<string, number>, internationalSpend: number, heavyInternational: boolean): { rewards: number; breakdown: CategoryBreakdown[]; foreignTxPenalty: number; noFtfBonus: number } {
  const totalAnnual = Object.values(annualSpending).reduce((s, v) => s + v, 0);
  let rewards = 0;
  const breakdown: CategoryBreakdown[] = [];

  const categoryRewards = new Map<string, { spend: number; multiplier: number; pointValue: number; description: string }[]>();
  for (const reward of card.rewards) {
    const existing = categoryRewards.get(reward.category) || [];
    existing.push({ spend: 0, multiplier: reward.multiplier, pointValue: card.pointValue, description: reward.description });
    categoryRewards.set(reward.category, existing);
  }

  for (const [category, entries] of categoryRewards.entries()) {
    let totalSpend = 0;
    switch (category) {
      case "groceries": totalSpend = annualSpending.groceries; break;
      case "dining": totalSpend = annualSpending.dining; break;
      case "travel": totalSpend = annualSpending.travel; break;
      case "gas": totalSpend = annualSpending.gas; break;
      case "online": totalSpend = annualSpending.online; break;
      case "rotating": totalSpend = Math.min(totalAnnual * 0.15, 6000); break;
      case "other": totalSpend = annualSpending.other; break;
      default: totalSpend = 0;
    }

    if (totalSpend <= 0) continue;

    if (entries.length === 1) {
      const entry = entries[0];
      const rewardValue = totalSpend * entry.multiplier * entry.pointValue;
      rewards += rewardValue;
      breakdown.push({
        category,
        annualSpend: totalSpend,
        multiplier: entry.multiplier,
        pointValue: entry.pointValue,
        rewardValue,
        description: entry.description,
      });
    } else {
      entries.sort((a, b) => b.multiplier - a.multiplier);
      const splitCount = entries.length;
      const spendPerEntry = totalSpend / splitCount;

      for (const entry of entries) {
        const rewardValue = spendPerEntry * entry.multiplier * entry.pointValue;
        rewards += rewardValue;
        breakdown.push({
          category,
          annualSpend: spendPerEntry,
          multiplier: entry.multiplier,
          pointValue: entry.pointValue,
          rewardValue,
          description: entry.description,
        });
      }
    }
  }

  let foreignTxPenalty = 0;
  if (!card.noForeignTransactionFee && internationalSpend > 0) {
    foreignTxPenalty = internationalSpend * 0.03;
  }

  let noFtfBonus = 0;
  if (card.noForeignTransactionFee && heavyInternational) {
    noFtfBonus = internationalSpend * 0.03;
  }

  return { rewards, breakdown, foreignTxPenalty, noFtfBonus };
}

function buildCurrentCardComparisons(
  recommendedCard: CreditCardData,
  recRewards: number,
  recNetValue: number,
  recBreakdown: CategoryBreakdown[],
  currentCards: CurrentCard[],
  annualSpending: Record<string, number>,
  internationalSpend: number,
  heavyInternational: boolean,
): CurrentCardComparison[] {
  if (!currentCards || currentCards.length === 0) return [];

  const comparisons: CurrentCardComparison[] = [];

  for (const current of currentCards) {
    const dbCard = creditCards.find((c) => c.name === current.name);

    if (!dbCard) {
      comparisons.push({
        currentCardName: current.name,
        currentCardAnnualFee: current.annualFee,
        advice: "swap",
        explanation: `We couldn't find "${current.name}" in our database to compare. Consider the ${recommendedCard.name} which earns an estimated $${recRewards.toFixed(0)}/yr in rewards.`,
        currentCardValue: 0,
        recommendedCardValue: recNetValue,
      });
      continue;
    }

    if (dbCard.name === recommendedCard.name) {
      continue;
    }

    const currentScored = scoreCard(dbCard, annualSpending, internationalSpend, heavyInternational);
    const currentNetValue = currentScored.rewards - dbCard.annualFee - currentScored.foreignTxPenalty + currentScored.noFtfBonus;

    const valueDiff = recNetValue - currentNetValue;

    const recTopCategories = recBreakdown
      .filter((b) => b.rewardValue > 0 && b.category !== "other")
      .sort((a, b) => b.rewardValue - a.rewardValue)
      .slice(0, 3)
      .map((b) => b.category);

    const currentTopCategories = currentScored.breakdown
      .filter((b) => b.rewardValue > 0 && b.category !== "other")
      .sort((a, b) => b.rewardValue - a.rewardValue)
      .slice(0, 3)
      .map((b) => b.category);

    const recUniqueStrengths = recTopCategories.filter((c) => !currentTopCategories.includes(c));
    const currentUniqueStrengths = currentTopCategories.filter((c) => !recTopCategories.includes(c));

    let advice: "swap" | "keep-both" | "current-is-better";
    let explanation: string;

    if (valueDiff > 100) {
      if (recUniqueStrengths.length > 0 && currentUniqueStrengths.length > 0) {
        advice = "keep-both";
        explanation = `The ${recommendedCard.name} earns $${valueDiff.toFixed(0)}/yr more overall, but your ${dbCard.name} has unique strengths in ${currentUniqueStrengths.join(", ")}. Keep both to maximize rewards across categories.`;
      } else {
        advice = "swap";
        explanation = `The ${recommendedCard.name} earns $${valueDiff.toFixed(0)}/yr more in net value ($${recNetValue.toFixed(0)} vs $${currentNetValue.toFixed(0)}). It outperforms your ${dbCard.name} across your spending pattern.`;
      }
    } else if (valueDiff > 0) {
      if (recUniqueStrengths.length > 0 && currentUniqueStrengths.length > 0) {
        advice = "keep-both";
        explanation = `Both cards are close in overall value. The ${recommendedCard.name} is stronger in ${recUniqueStrengths.join(", ")}, while your ${dbCard.name} excels in ${currentUniqueStrengths.join(", ")}. Keeping both gives you the best of each.`;
      } else {
        advice = "keep-both";
        explanation = `The ${recommendedCard.name} earns slightly more ($${valueDiff.toFixed(0)}/yr difference), but both cards serve you well. Consider keeping both.`;
      }
    } else {
      advice = "current-is-better";
      explanation = `Your ${dbCard.name} currently earns $${Math.abs(valueDiff).toFixed(0)}/yr more in net value ($${currentNetValue.toFixed(0)} vs $${recNetValue.toFixed(0)}) based on your spending. Stick with it unless the ${recommendedCard.name}'s perks appeal to you.`;
    }

    comparisons.push({
      currentCardName: dbCard.name,
      currentCardAnnualFee: dbCard.annualFee,
      advice,
      explanation,
      currentCardValue: currentNetValue,
      recommendedCardValue: recNetValue,
    });
  }

  return comparisons;
}

export function generateRecommendations(session: SpendingSession): CardRecommendation[] {
  const annualSpending = getAnnualSpending(session);
  const totalAnnual = Object.values(annualSpending).reduce((s, v) => s + v, 0);
  const internationalSpend = session.annualTravelBudget * (session.internationalTravelPercent / 100);
  const heavyInternational = session.internationalTravelPercent >= 30 && internationalSpend > 1000;

  const currentCardNames = (session.currentCards || []).map((c) => c.name.toLowerCase());

  const scored: CardRecommendation[] = creditCards.map((card) => {
    const { rewards: estimatedRewards, breakdown: categoryBreakdown, foreignTxPenalty, noFtfBonus } = scoreCard(card, annualSpending, internationalSpend, heavyInternational);

    const netAnnualValue = estimatedRewards - card.annualFee - foreignTxPenalty + noFtfBonus;

    const breakEven: Record<string, number> = {};
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

    const isCurrentCard = currentCardNames.some((cn) => card.name.toLowerCase() === cn);

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
        actionExplanation = `Upgrade from your ${from.name} ($${from.annualFee}/yr) to unlock better rewards. The additional $${card.annualFee - from.annualFee}/yr in fees should be offset by stronger rewards.`;
      }
    }

    const sortedBreakdown = [...categoryBreakdown].sort((a, b) => b.rewardValue - a.rewardValue);
    const whyRecommended = buildExplanation(card, sortedBreakdown, heavyInternational, netAnnualValue, estimatedRewards);

    const currentCardComparisons = buildCurrentCardComparisons(
      card, estimatedRewards, netAnnualValue, categoryBreakdown,
      session.currentCards || [], annualSpending, internationalSpend, heavyInternational
    );

    return {
      cardName: card.name,
      issuer: card.issuer,
      annualFee: card.annualFee,
      signUpBonus: card.signUpBonus,
      signUpSpendRequirement: card.signUpSpendRequirement,
      signUpTimeframe: card.signUpTimeframe,
      rewardsBreakdown: card.rewards,
      categoryBreakdown: sortedBreakdown,
      currentCardComparisons,
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
  breakdown: CategoryBreakdown[],
  heavyInternational: boolean,
  netValue: number,
  rewards: number,
): string {
  const parts: string[] = [];

  const topEarners = breakdown
    .filter((b) => b.category !== "other" && b.rewardValue > 0)
    .slice(0, 3);

  if (topEarners.length > 0) {
    const earnerTexts = topEarners.map((b) =>
      `$${b.rewardValue.toFixed(0)}/yr from ${b.category} (${b.annualSpend.toLocaleString()}/yr at ${b.multiplier}x)`
    );
    parts.push(`Top earnings: ${earnerTexts.join(", ")}.`);
  }

  if (card.noForeignTransactionFee && heavyInternational) {
    parts.push("No foreign transaction fees save you ~3% on international purchases.");
  }

  if (netValue > 200) {
    parts.push(`Estimated net annual value of $${netValue.toFixed(0)} after the $${card.annualFee} fee.`);
  } else if (netValue > 0 && card.annualFee > 0) {
    parts.push(`The $${card.annualFee} annual fee is covered by your estimated $${rewards.toFixed(0)} in rewards.`);
  } else if (card.annualFee === 0) {
    parts.push("No annual fee means every dollar of rewards is pure profit.");
  }

  return parts.join(" ") || `A solid choice with $${rewards.toFixed(0)} in estimated annual rewards.`;
}
