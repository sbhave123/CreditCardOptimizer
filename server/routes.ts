import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { generateRecommendations } from "./recommendationEngine";
import { z } from "zod";

const createSessionSchema = z.object({
  name: z.string().min(1).max(200),
});

const currentCardSchema = z.object({
  name: z.string().min(1),
  annualFee: z.number().min(0),
  category: z.string().optional(),
});

const updateSessionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  monthlyGroceries: z.number().min(0).max(100000).optional(),
  monthlyDining: z.number().min(0).max(100000).optional(),
  monthlyTravel: z.number().min(0).max(100000).optional(),
  monthlyGas: z.number().min(0).max(100000).optional(),
  monthlyOnline: z.number().min(0).max(100000).optional(),
  monthlyOther: z.number().min(0).max(100000).optional(),
  annualTravelBudget: z.number().min(0).max(1000000).optional(),
  domesticTravelPercent: z.number().min(0).max(100).optional(),
  internationalTravelPercent: z.number().min(0).max(100).optional(),
  currentCards: z.array(currentCardSchema).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) return res.status(404).json({ message: "Session not found" });
      if (session.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = createSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }
      const userId = req.user.claims.sub;
      const session = await storage.createSession({
        userId,
        name: parsed.data.name,
        monthlyGroceries: 0,
        monthlyDining: 0,
        monthlyTravel: 0,
        monthlyGas: 0,
        monthlyOnline: 0,
        monthlyOther: 0,
        annualTravelBudget: 0,
        domesticTravelPercent: 70,
        internationalTravelPercent: 30,
        currentCards: [],
      });
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const existing = await storage.getSession(req.params.id);
      if (!existing) return res.status(404).json({ message: "Session not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

      const parsed = updateSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }

      const session = await storage.updateSession(req.params.id, parsed.data);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const existing = await storage.getSession(req.params.id);
      if (!existing) return res.status(404).json({ message: "Session not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteSession(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  app.post("/api/sessions/:id/duplicate", isAuthenticated, async (req: any, res) => {
    try {
      const existing = await storage.getSession(req.params.id);
      if (!existing) return res.status(404).json({ message: "Session not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const session = await storage.duplicateSession(req.params.id);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error duplicating session:", error);
      res.status(500).json({ message: "Failed to duplicate session" });
    }
  });

  app.post("/api/sessions/:id/recommend", isAuthenticated, async (req: any, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) return res.status(404).json({ message: "Session not found" });
      if (session.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

      const recommendations = generateRecommendations(session);
      const updated = await storage.updateSessionRecommendations(req.params.id, recommendations);
      res.json(updated);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.get("/api/credit-cards", isAuthenticated, async (_req, res) => {
    try {
      const { creditCards } = await import("./creditCards");
      res.json(creditCards);
    } catch (error) {
      console.error("Error fetching credit cards:", error);
      res.status(500).json({ message: "Failed to fetch credit cards" });
    }
  });

  return httpServer;
}
