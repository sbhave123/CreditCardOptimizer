export * from "./models/auth";

import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export const spendingSessions = pgTable("spending_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  monthlyGroceries: real("monthly_groceries").notNull().default(0),
  monthlyDining: real("monthly_dining").notNull().default(0),
  monthlyTravel: real("monthly_travel").notNull().default(0),
  monthlyGas: real("monthly_gas").notNull().default(0),
  monthlyOnline: real("monthly_online").notNull().default(0),
  monthlyOther: real("monthly_other").notNull().default(0),
  annualTravelBudget: real("annual_travel_budget").notNull().default(0),
  domesticTravelPercent: real("domestic_travel_percent").notNull().default(70),
  internationalTravelPercent: real("international_travel_percent").notNull().default(30),
  currentCards: jsonb("current_cards").$type<CurrentCard[]>().default([]),
  recommendations: jsonb("recommendations").$type<CardRecommendation[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spendingSessionsRelations = relations(spendingSessions, ({ one }) => ({
  user: one(users, {
    fields: [spendingSessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  spendingSessions: many(spendingSessions),
}));

export const insertSpendingSessionSchema = createInsertSchema(spendingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  recommendations: true,
});

export type InsertSpendingSession = z.infer<typeof insertSpendingSessionSchema>;
export type SpendingSession = typeof spendingSessions.$inferSelect;

export interface CurrentCard {
  name: string;
  annualFee: number;
  category?: string;
}

export interface CategoryBreakdown {
  category: string;
  annualSpend: number;
  multiplier: number;
  pointValue: number;
  rewardValue: number;
  description: string;
}

export interface CurrentCardComparison {
  currentCardName: string;
  currentCardAnnualFee: number;
  advice: "swap" | "keep-both" | "current-is-better";
  explanation: string;
  currentCardValue: number;
  recommendedCardValue: number;
}

export interface CardRecommendation {
  cardName: string;
  issuer: string;
  annualFee: number;
  signUpBonus: string;
  signUpSpendRequirement: number;
  signUpTimeframe: number;
  rewardsBreakdown: RewardCategory[];
  categoryBreakdown: CategoryBreakdown[];
  currentCardComparisons: CurrentCardComparison[];
  estimatedAnnualRewards: number;
  netAnnualValue: number;
  noForeignTransactionFee: boolean;
  whyRecommended: string;
  breakEvenSpending: Record<string, number>;
  action: "new" | "upgrade" | "swap" | "keep";
  actionExplanation?: string;
  score: number;
}

export interface RewardCategory {
  category: string;
  multiplier: number;
  description: string;
}

export interface CreditCardData {
  name: string;
  issuer: string;
  annualFee: number;
  signUpBonus: string;
  signUpSpendRequirement: number;
  signUpTimeframe: number;
  rewards: RewardCategory[];
  noForeignTransactionFee: boolean;
  pointValue: number;
  category: string;
}
