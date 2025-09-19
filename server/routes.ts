import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChoreSchema, insertRewardSchema, insertTransactionSchema, insertUserSchema, choreApprovalSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const USER_ID = "23391fd0-66f6-4e7b-bed1-1b71a93a6d9d"; // Default user for MVP

  // Helper function to get current user from request (MVP: using default user)
  // In production, this would extract user ID from session/JWT token
  function getCurrentUserId(req: Request): string {
    // For MVP, we use the default user, but in production this would be:
    // return req.user?.id || req.session?.userId || req.headers.authorization
    return USER_ID;
  }

  // Helper function to check admin permissions for requesting user
  async function checkAdminPermission(req: Request): Promise<boolean> {
    const currentUserId = getCurrentUserId(req);
    const user = await storage.getUser(currentUserId);
    return user?.isAdmin === true;
  }

  // Middleware to require admin access
  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = await checkAdminPermission(req);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  }

  // Helper function to send notifications
  async function sendNotification(userId: string, title: string, message: string, type: string, choreId?: string) {
    try {
      await storage.createNotification({
        userId,
        title,
        message,
        type,
        choreId
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Get current user with points
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(USER_ID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Get all family members
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Create new family member
  app.post("/api/users", async (req, res) => {
    try {
      // For family management, set a default password since authentication isn't the focus
      const userData = {
        ...insertUserSchema.omit({ password: true }).parse(req.body),
        password: "family", // Default password for family members
        isAdmin: false // Family members are not admins by default
      };
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create family member" });
    }
  });

  // Chore routes
  app.get("/api/chores", async (req, res) => {
    try {
      const chores = await storage.getChores();
      res.json(chores);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chores" });
    }
  });

  app.post("/api/chores", async (req, res) => {
    try {
      const choreData = insertChoreSchema.parse(req.body);
      const chore = await storage.createChore(choreData);
      res.status(201).json(chore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chore data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chore" });
    }
  });

  app.put("/api/chores/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertChoreSchema.partial().parse(req.body);
      const chore = await storage.updateChore(id, updates);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }
      res.json(chore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chore data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update chore" });
    }
  });

  app.delete("/api/chores/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteChore(id);
      if (!deleted) {
        return res.status(404).json({ message: "Chore not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chore" });
    }
  });

  app.post("/api/chores/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const chore = await storage.completeChore(id);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found or already completed" });
      }

      // Send notification to admins about pending approval
      const allUsers = await storage.getUsers();
      const admins = allUsers.filter(user => user.isAdmin);
      
      for (const admin of admins) {
        await sendNotification(
          admin.id,
          "Chore Completed - Pending Approval",
          `${chore.name} has been completed and needs your approval`,
          "chore_completed",
          chore.id
        );
      }

      res.json(chore);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete chore" });
    }
  });

  // Approval routes (admin only)
  app.post("/api/chores/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = choreApprovalSchema.parse(req.body);
      
      const currentUserId = getCurrentUserId(req);

      const chore = await storage.getChore(id);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }

      if (chore.status !== 'completed') {
        return res.status(400).json({ message: "Chore must be completed before approval" });
      }

      // Approve the chore
      const approvedChore = await storage.approveChore(id, currentUserId, comment);
      if (!approvedChore) {
        return res.status(500).json({ message: "Failed to approve chore" });
      }

      // Award points to assigned user (or default user if no assignment)
      const userId = approvedChore.assignedToId || USER_ID;
      const user = await storage.getUser(userId);
      if (user) {
        const newPoints = user.points + approvedChore.points;
        await storage.updateUserPoints(userId, newPoints);
        
        // Create transaction record
        await storage.createTransaction({
          type: "earn",
          amount: approvedChore.points,
          description: `Approved: ${approvedChore.name}`,
          choreId: approvedChore.id,
          rewardId: null,
          userId: userId,
        });

        // Send approval notification to the user who completed the chore
        await sendNotification(
          userId,
          "Chore Approved! 🎉",
          `Your completion of "${approvedChore.name}" has been approved. You earned ${approvedChore.points} points!`,
          "chore_approved",
          approvedChore.id
        );
      }

      res.json(approvedChore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid approval data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to approve chore" });
    }
  });

  app.post("/api/chores/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = choreApprovalSchema.parse(req.body);
      
      const currentUserId = getCurrentUserId(req);

      const chore = await storage.getChore(id);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }

      if (chore.status !== 'completed') {
        return res.status(400).json({ message: "Chore must be completed before rejection" });
      }

      // Reject the chore
      const rejectedChore = await storage.rejectChore(id, currentUserId, comment);
      if (!rejectedChore) {
        return res.status(500).json({ message: "Failed to reject chore" });
      }

      // Send rejection notification to the user who completed the chore
      const userId = rejectedChore.assignedToId || USER_ID;
      await sendNotification(
        userId,
        "Chore Rejected",
        `Your completion of "${rejectedChore.name}" was rejected. ${comment ? `Reason: ${comment}` : 'Please try again.'}`,
        "chore_rejected",
        rejectedChore.id
      );

      res.json(rejectedChore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rejection data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reject chore" });
    }
  });

  // Get pending approval chores (admin only)
  app.get("/api/chores/pending-approval", requireAdmin, async (req, res) => {
    try {
      const pendingChores = await storage.getPendingApprovalChores();
      res.json(pendingChores);
    } catch (error) {
      res.status(500).json({ message: "Failed to get pending approval chores" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications(USER_ID);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/unread", async (req, res) => {
    try {
      const notifications = await storage.getUnreadNotifications(USER_ID);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/mark-all-read", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(USER_ID);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Reward routes
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });

  app.post("/api/rewards", async (req, res) => {
    try {
      const rewardData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  app.put("/api/rewards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertRewardSchema.partial().parse(req.body);
      const reward = await storage.updateReward(id, updates);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      res.json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update reward" });
    }
  });

  app.delete("/api/rewards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReward(id);
      if (!deleted) {
        return res.status(404).json({ message: "Reward not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  app.post("/api/rewards/:id/claim", async (req, res) => {
    try {
      const { id } = req.params;
      const reward = await storage.getReward(id);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }

      const user = await storage.getUser(USER_ID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.points < reward.cost) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      // Deduct points from user
      const newPoints = user.points - reward.cost;
      await storage.updateUserPoints(USER_ID, newPoints);

      // Mark reward as unavailable (one-time use)
      await storage.updateReward(id, { isAvailable: false });

      // Create transaction record
      await storage.createTransaction({
        type: "spend",
        amount: reward.cost,
        description: `Claimed: ${reward.name}`,
        choreId: null,
        rewardId: reward.id,
      });

      res.json({ message: "Reward claimed successfully", newPoints });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim reward" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
