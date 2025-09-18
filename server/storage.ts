import { type User, type InsertUser, type Chore, type InsertChore, type Reward, type InsertReward, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(id: string, points: number): Promise<User | undefined>;
  
  // Chore methods
  getChores(): Promise<Chore[]>;
  getChore(id: string): Promise<Chore | undefined>;
  createChore(chore: InsertChore): Promise<Chore>;
  updateChore(id: string, updates: Partial<Chore>): Promise<Chore | undefined>;
  deleteChore(id: string): Promise<boolean>;
  completeChore(id: string): Promise<Chore | undefined>;
  
  // Reward methods
  getRewards(): Promise<Reward[]>;
  getReward(id: string): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: string, updates: Partial<Reward>): Promise<Reward | undefined>;
  deleteReward(id: string): Promise<boolean>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chores: Map<string, Chore>;
  private rewards: Map<string, Reward>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this.chores = new Map();
    this.rewards = new Map();
    this.transactions = new Map();
    
    // Initialize with default user
    const defaultUser: User = {
      id: "user-1",
      username: "default",
      password: "password",
      points: 1247
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, points: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUserPoints(id: string, points: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, points };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Chore methods
  async getChores(): Promise<Chore[]> {
    return Array.from(this.chores.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getChore(id: string): Promise<Chore | undefined> {
    return this.chores.get(id);
  }

  async createChore(insertChore: InsertChore): Promise<Chore> {
    const id = randomUUID();
    const chore: Chore = { 
      ...insertChore, 
      id, 
      description: insertChore.description || null,
      estimatedTime: insertChore.estimatedTime || null,
      isCompleted: false,
      completedAt: null,
      createdAt: new Date()
    };
    this.chores.set(id, chore);
    return chore;
  }

  async updateChore(id: string, updates: Partial<Chore>): Promise<Chore | undefined> {
    const chore = this.chores.get(id);
    if (!chore) return undefined;
    
    const updatedChore = { ...chore, ...updates };
    this.chores.set(id, updatedChore);
    return updatedChore;
  }

  async deleteChore(id: string): Promise<boolean> {
    return this.chores.delete(id);
  }

  async completeChore(id: string): Promise<Chore | undefined> {
    const chore = this.chores.get(id);
    if (!chore || chore.isCompleted) return undefined;
    
    const completedChore = { 
      ...chore, 
      isCompleted: true, 
      completedAt: new Date() 
    };
    this.chores.set(id, completedChore);
    return completedChore;
  }

  // Reward methods
  async getRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getReward(id: string): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }

  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = randomUUID();
    const reward: Reward = { 
      ...insertReward, 
      id, 
      description: insertReward.description || null,
      icon: insertReward.icon || null,
      isAvailable: insertReward.isAvailable ?? true,
      createdAt: new Date()
    };
    this.rewards.set(id, reward);
    return reward;
  }

  async updateReward(id: string, updates: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewards.get(id);
    if (!reward) return undefined;
    
    const updatedReward = { ...reward, ...updates };
    this.rewards.set(id, updatedReward);
    return updatedReward;
  }

  async deleteReward(id: string): Promise<boolean> {
    return this.rewards.delete(id);
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      choreId: insertTransaction.choreId || null,
      rewardId: insertTransaction.rewardId || null,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
}

export const storage = new MemStorage();
