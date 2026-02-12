import { spendingSessions, type SpendingSession, type InsertSpendingSession, type CardRecommendation } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getSessionsByUser(userId: string): Promise<SpendingSession[]>;
  getSession(id: string): Promise<SpendingSession | undefined>;
  createSession(data: InsertSpendingSession): Promise<SpendingSession>;
  updateSession(id: string, data: Partial<InsertSpendingSession>): Promise<SpendingSession | undefined>;
  updateSessionRecommendations(id: string, recommendations: CardRecommendation[]): Promise<SpendingSession | undefined>;
  deleteSession(id: string): Promise<void>;
  duplicateSession(id: string): Promise<SpendingSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getSessionsByUser(userId: string): Promise<SpendingSession[]> {
    return db.select().from(spendingSessions).where(eq(spendingSessions.userId, userId)).orderBy(desc(spendingSessions.updatedAt));
  }

  async getSession(id: string): Promise<SpendingSession | undefined> {
    const [session] = await db.select().from(spendingSessions).where(eq(spendingSessions.id, id));
    return session || undefined;
  }

  async createSession(data: InsertSpendingSession): Promise<SpendingSession> {
    const [session] = await db.insert(spendingSessions).values(data).returning();
    return session;
  }

  async updateSession(id: string, data: Partial<InsertSpendingSession>): Promise<SpendingSession | undefined> {
    const [session] = await db
      .update(spendingSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(spendingSessions.id, id))
      .returning();
    return session || undefined;
  }

  async updateSessionRecommendations(id: string, recommendations: CardRecommendation[]): Promise<SpendingSession | undefined> {
    const [session] = await db
      .update(spendingSessions)
      .set({ recommendations, updatedAt: new Date() })
      .where(eq(spendingSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(spendingSessions).where(eq(spendingSessions.id, id));
  }

  async duplicateSession(id: string): Promise<SpendingSession | undefined> {
    const original = await this.getSession(id);
    if (!original) return undefined;
    const { id: _, createdAt, updatedAt, ...rest } = original;
    const [session] = await db.insert(spendingSessions).values({
      ...rest,
      name: `${original.name} (copy)`,
      recommendations: [],
    }).returning();
    return session;
  }
}

export const storage = new DatabaseStorage();
