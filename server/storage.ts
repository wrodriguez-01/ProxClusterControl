import { 
  type User, 
  type InsertUser, 
  type ProxmoxServer, 
  type InsertProxmoxServer,
  type ScriptExecution,
  type InsertScriptExecution,
  type UpdateScriptExecution
} from "@shared/schema";
import { db } from "./db";
import { users, proxmoxServers, scriptExecutions } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Proxmox server management
  getProxmoxServers(): Promise<ProxmoxServer[]>;
  getProxmoxServer(id: string): Promise<ProxmoxServer | undefined>;
  getDefaultProxmoxServer(): Promise<ProxmoxServer | undefined>;
  createProxmoxServer(server: InsertProxmoxServer): Promise<ProxmoxServer>;
  updateProxmoxServer(id: string, updates: Partial<ProxmoxServer>): Promise<ProxmoxServer | undefined>;
  deleteProxmoxServer(id: string): Promise<boolean>;

  // Script execution management
  getScriptExecutions(filters?: { 
    serverId?: string; 
    nodeName?: string; 
    status?: string; 
    scriptId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScriptExecution[]>;
  getScriptExecution(id: string): Promise<ScriptExecution | undefined>;
  createScriptExecution(execution: InsertScriptExecution): Promise<ScriptExecution>;
  updateScriptExecution(id: string, updates: UpdateScriptExecution): Promise<ScriptExecution | undefined>;
  deleteScriptExecution(id: string): Promise<boolean>;
  getActiveExecutions(serverId?: string, nodeName?: string): Promise<ScriptExecution[]>;
}

export class PostgreSQLStorage implements IStorage {
  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw new Error('Failed to get user by username');
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Username already exists');
      }
      throw new Error('Failed to create user');
    }
  }

  // Proxmox server management methods
  async getProxmoxServers(): Promise<ProxmoxServer[]> {
    try {
      const result = await db.select().from(proxmoxServers).orderBy(proxmoxServers.createdAt);
      return result.map(this.transformServerFromDB);
    } catch (error) {
      console.error('Error getting proxmox servers:', error);
      throw new Error('Failed to get proxmox servers');
    }
  }

  async getProxmoxServer(id: string): Promise<ProxmoxServer | undefined> {
    try {
      const result = await db.select().from(proxmoxServers).where(eq(proxmoxServers.id, id)).limit(1);
      return result[0] ? this.transformServerFromDB(result[0]) : undefined;
    } catch (error) {
      console.error('Error getting proxmox server:', error);
      throw new Error('Failed to get proxmox server');
    }
  }

  async getDefaultProxmoxServer(): Promise<ProxmoxServer | undefined> {
    try {
      const result = await db.select().from(proxmoxServers).where(eq(proxmoxServers.isDefault, true)).limit(1);
      return result[0] ? this.transformServerFromDB(result[0]) : undefined;
    } catch (error) {
      console.error('Error getting default proxmox server:', error);
      throw new Error('Failed to get default proxmox server');
    }
  }

  async createProxmoxServer(insertServer: InsertProxmoxServer): Promise<ProxmoxServer> {
    try {
      // TODO: Implement credential encryption for production security
      // Store passwords encrypted at rest using AES-256-GCM with per-server keys
      // See: https://nodejs.org/api/crypto.html#crypto_crypto_createcipher_algorithm_password
      
      // If this is the first server or explicitly marked as default, make it default
      const existingServers = await this.getProxmoxServers();
      const shouldBeDefault = existingServers.length === 0 || insertServer.isDefault;
      
      // If setting as default, unset all other defaults first
      if (shouldBeDefault) {
        await db.update(proxmoxServers)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(proxmoxServers.isDefault, true));
      }

      const serverData = {
        ...insertServer,
        isDefault: shouldBeDefault,
        status: "disconnected" as const,
      };
      
      const result = await db.insert(proxmoxServers).values(serverData).returning();
      return this.transformServerFromDB(result[0]);
    } catch (error) {
      console.error('Error creating proxmox server:', error);
      throw new Error('Failed to create proxmox server');
    }
  }

  async updateProxmoxServer(id: string, updates: Partial<ProxmoxServer>): Promise<ProxmoxServer | undefined> {
    try {
      // Handle default server logic
      if (updates.isDefault === true) {
        // Unset all other defaults first
        await db.update(proxmoxServers)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(proxmoxServers.isDefault, true), eq(proxmoxServers.id, id)));
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      const result = await db.update(proxmoxServers)
        .set(updateData)
        .where(eq(proxmoxServers.id, id))
        .returning();
      
      return result[0] ? this.transformServerFromDB(result[0]) : undefined;
    } catch (error) {
      console.error('Error updating proxmox server:', error);
      throw new Error('Failed to update proxmox server');
    }
  }

  async deleteProxmoxServer(id: string): Promise<boolean> {
    try {
      const serverToDelete = await this.getProxmoxServer(id);
      if (!serverToDelete) {
        return false;
      }

      const result = await db.delete(proxmoxServers).where(eq(proxmoxServers.id, id)).returning();
      
      // If we deleted the default server, make the first remaining server default
      if (result.length > 0 && serverToDelete.isDefault) {
        const remainingServers = await this.getProxmoxServers();
        if (remainingServers.length > 0) {
          await this.updateProxmoxServer(remainingServers[0].id, { isDefault: true });
        }
      }

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting proxmox server:', error);
      throw new Error('Failed to delete proxmox server');
    }
  }

  // Script execution management methods
  async getScriptExecutions(filters?: { 
    serverId?: string; 
    nodeName?: string; 
    status?: string; 
    scriptId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScriptExecution[]> {
    try {
      let query = db.select().from(scriptExecutions);
      
      // Apply filters
      const conditions = [];
      if (filters?.serverId) {
        conditions.push(eq(scriptExecutions.serverId, filters.serverId));
      }
      if (filters?.nodeName) {
        conditions.push(eq(scriptExecutions.nodeName, filters.nodeName));
      }
      if (filters?.status) {
        conditions.push(eq(scriptExecutions.status, filters.status));
      }
      if (filters?.scriptId) {
        conditions.push(eq(scriptExecutions.scriptId, filters.scriptId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Order by creation time (newest first)
      query = query.orderBy(desc(scriptExecutions.createdAt));
      
      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }
      
      const result = await query;
      return result.map(this.transformExecutionFromDB);
    } catch (error) {
      console.error('Error getting script executions:', error);
      throw new Error('Failed to get script executions');
    }
  }

  async getScriptExecution(id: string): Promise<ScriptExecution | undefined> {
    try {
      const result = await db.select().from(scriptExecutions).where(eq(scriptExecutions.id, id)).limit(1);
      return result[0] ? this.transformExecutionFromDB(result[0]) : undefined;
    } catch (error) {
      console.error('Error getting script execution:', error);
      throw new Error('Failed to get script execution');
    }
  }

  async createScriptExecution(execution: InsertScriptExecution): Promise<ScriptExecution> {
    try {
      const result = await db.insert(scriptExecutions).values(execution).returning();
      return this.transformExecutionFromDB(result[0]);
    } catch (error) {
      console.error('Error creating script execution:', error);
      throw new Error('Failed to create script execution');
    }
  }

  async updateScriptExecution(id: string, updates: UpdateScriptExecution): Promise<ScriptExecution | undefined> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      const result = await db.update(scriptExecutions)
        .set(updateData)
        .where(eq(scriptExecutions.id, id))
        .returning();
      
      return result[0] ? this.transformExecutionFromDB(result[0]) : undefined;
    } catch (error) {
      console.error('Error updating script execution:', error);
      throw new Error('Failed to update script execution');
    }
  }

  async deleteScriptExecution(id: string): Promise<boolean> {
    try {
      const result = await db.delete(scriptExecutions).where(eq(scriptExecutions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting script execution:', error);
      throw new Error('Failed to delete script execution');
    }
  }

  async getActiveExecutions(serverId?: string, nodeName?: string): Promise<ScriptExecution[]> {
    try {
      const conditions = [
        eq(scriptExecutions.status, 'running'),
        eq(scriptExecutions.status, 'pending')
      ];
      
      let query = db.select().from(scriptExecutions).where(
        and(...conditions)
      );
      
      // Apply additional filters
      const additionalConditions = [];
      if (serverId) {
        additionalConditions.push(eq(scriptExecutions.serverId, serverId));
      }
      if (nodeName) {
        additionalConditions.push(eq(scriptExecutions.nodeName, nodeName));
      }
      
      if (additionalConditions.length > 0) {
        query = query.where(and(...conditions, ...additionalConditions));
      }
      
      const result = await query.orderBy(desc(scriptExecutions.startTime));
      return result.map(this.transformExecutionFromDB);
    } catch (error) {
      console.error('Error getting active executions:', error);
      throw new Error('Failed to get active executions');
    }
  }

  // Helper method to transform database records to expected format
  private transformServerFromDB(dbServer: any): ProxmoxServer {
    return {
      id: dbServer.id,
      name: dbServer.name,
      hostname: dbServer.hostname,
      port: dbServer.port,
      username: dbServer.username,
      password: dbServer.password,
      realm: dbServer.realm,
      useSSL: dbServer.useSSL,
      ignoreCert: dbServer.ignoreCert,
      isDefault: dbServer.isDefault,
      status: dbServer.status,
      lastConnected: dbServer.lastConnected ? dbServer.lastConnected.toISOString() : undefined,
      version: dbServer.version,
      errorMessage: dbServer.errorMessage,
    };
  }

  // Helper method to transform script execution database records
  private transformExecutionFromDB(dbExecution: any): ScriptExecution {
    return {
      id: dbExecution.id,
      scriptId: dbExecution.scriptId,
      scriptName: dbExecution.scriptName,
      command: dbExecution.command,
      serverId: dbExecution.serverId,
      nodeName: dbExecution.nodeName,
      status: dbExecution.status,
      startTime: dbExecution.startTime,
      endTime: dbExecution.endTime,
      output: dbExecution.output,
      errorOutput: dbExecution.errorOutput,
      exitCode: dbExecution.exitCode,
      duration: dbExecution.duration,
      createdBy: dbExecution.createdBy,
      metadata: dbExecution.metadata,
      createdAt: dbExecution.createdAt,
      updatedAt: dbExecution.updatedAt,
    };
  }
}

// Fallback MemStorage class for development/testing
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private proxmoxServers: Map<string, ProxmoxServer>;
  private scriptExecutions: Map<string, ScriptExecution>;

  constructor() {
    this.users = new Map();
    this.proxmoxServers = new Map();
    this.scriptExecutions = new Map();
  }

  // User management methods
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Proxmox server management methods
  async getProxmoxServers(): Promise<ProxmoxServer[]> {
    return Array.from(this.proxmoxServers.values());
  }

  async getProxmoxServer(id: string): Promise<ProxmoxServer | undefined> {
    return this.proxmoxServers.get(id);
  }

  async getDefaultProxmoxServer(): Promise<ProxmoxServer | undefined> {
    return Array.from(this.proxmoxServers.values()).find(
      (server) => server.isDefault === true,
    );
  }

  async createProxmoxServer(insertServer: InsertProxmoxServer): Promise<ProxmoxServer> {
    const id = randomUUID();
    
    // If this is the first server or explicitly marked as default, make it default
    const existingServers = Array.from(this.proxmoxServers.values());
    const shouldBeDefault = existingServers.length === 0 || insertServer.isDefault;
    
    // If setting as default, unset all other defaults
    if (shouldBeDefault) {
      const entries = Array.from(this.proxmoxServers.entries());
      for (const [serverId, server] of entries) {
        if (server.isDefault) {
          this.proxmoxServers.set(serverId, { ...server, isDefault: false });
        }
      }
    }

    const server: ProxmoxServer = {
      ...insertServer,
      id,
      isDefault: shouldBeDefault,
      status: "disconnected",
    };
    
    this.proxmoxServers.set(id, server);
    return server;
  }

  async updateProxmoxServer(id: string, updates: Partial<ProxmoxServer>): Promise<ProxmoxServer | undefined> {
    const existingServer = this.proxmoxServers.get(id);
    if (!existingServer) {
      return undefined;
    }

    // Handle default server logic
    if (updates.isDefault === true) {
      // Unset all other defaults
      const entries = Array.from(this.proxmoxServers.entries());
      for (const [serverId, server] of entries) {
        if (server.isDefault && serverId !== id) {
          this.proxmoxServers.set(serverId, { ...server, isDefault: false });
        }
      }
    }

    const updatedServer = { ...existingServer, ...updates };
    this.proxmoxServers.set(id, updatedServer);
    return updatedServer;
  }

  async deleteProxmoxServer(id: string): Promise<boolean> {
    const server = this.proxmoxServers.get(id);
    if (!server) {
      return false;
    }

    this.proxmoxServers.delete(id);

    // If we deleted the default server, make the first remaining server default
    if (server.isDefault) {
      const remainingServers = Array.from(this.proxmoxServers.values());
      if (remainingServers.length > 0) {
        const firstServer = remainingServers[0];
        this.proxmoxServers.set(firstServer.id, { ...firstServer, isDefault: true });
      }
    }

    return true;
  }

  // Script execution management methods
  async getScriptExecutions(filters?: { 
    serverId?: string; 
    nodeName?: string; 
    status?: string; 
    scriptId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScriptExecution[]> {
    let executions = Array.from(this.scriptExecutions.values());
    
    // Apply filters
    if (filters?.serverId) {
      executions = executions.filter(exec => exec.serverId === filters.serverId);
    }
    if (filters?.nodeName) {
      executions = executions.filter(exec => exec.nodeName === filters.nodeName);
    }
    if (filters?.status) {
      executions = executions.filter(exec => exec.status === filters.status);
    }
    if (filters?.scriptId) {
      executions = executions.filter(exec => exec.scriptId === filters.scriptId);
    }
    
    // Sort by creation time (newest first)
    executions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    if (filters?.offset) {
      executions = executions.slice(filters.offset);
    }
    if (filters?.limit) {
      executions = executions.slice(0, filters.limit);
    }
    
    return executions;
  }

  async getScriptExecution(id: string): Promise<ScriptExecution | undefined> {
    return this.scriptExecutions.get(id);
  }

  async createScriptExecution(execution: InsertScriptExecution): Promise<ScriptExecution> {
    const id = randomUUID();
    const now = new Date();
    
    const scriptExecution: ScriptExecution = {
      ...execution,
      id,
      startTime: now,
      createdAt: now,
      updatedAt: now,
    };
    
    this.scriptExecutions.set(id, scriptExecution);
    return scriptExecution;
  }

  async updateScriptExecution(id: string, updates: UpdateScriptExecution): Promise<ScriptExecution | undefined> {
    const existing = this.scriptExecutions.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: ScriptExecution = {
      ...existing,
      ...updates,
      id, // Preserve the ID
      updatedAt: new Date(),
    };
    
    this.scriptExecutions.set(id, updated);
    return updated;
  }

  async deleteScriptExecution(id: string): Promise<boolean> {
    return this.scriptExecutions.delete(id);
  }

  async getActiveExecutions(serverId?: string, nodeName?: string): Promise<ScriptExecution[]> {
    let executions = Array.from(this.scriptExecutions.values()).filter(
      exec => exec.status === 'running' || exec.status === 'pending'
    );
    
    if (serverId) {
      executions = executions.filter(exec => exec.serverId === serverId);
    }
    if (nodeName) {
      executions = executions.filter(exec => exec.nodeName === nodeName);
    }
    
    // Sort by start time (newest first)
    executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    return executions;
  }
}

// Use PostgreSQL storage by default, fallback to memory storage if needed
export const storage = process.env.NODE_ENV === 'test' ? new MemStorage() : new PostgreSQLStorage();
