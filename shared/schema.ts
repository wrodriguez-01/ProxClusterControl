import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Proxmox Servers database table
export const proxmoxServers = pgTable("proxmox_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hostname: text("hostname").notNull(),
  port: integer("port").notNull().default(8006),
  username: text("username").notNull(),
  password: text("password").notNull(), // In production, this should be encrypted
  realm: text("realm").notNull().default("pam"),
  useSSL: boolean("use_ssl").notNull().default(true),
  ignoreCert: boolean("ignore_cert").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, testing, error
  lastConnected: timestamp("last_connected", { withTimezone: true }),
  version: text("version"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

// Sessions table for express-session store
export const sessions = pgTable("user_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(), // JSON session data
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

// Script Executions database table
export const scriptExecutions = pgTable("script_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scriptId: text("script_id").notNull(), // Script identifier (slug or ID)
  scriptName: text("script_name").notNull(),
  command: text("command").notNull(), // The actual command being executed
  serverId: varchar("server_id").notNull(), // Reference to proxmox server
  nodeName: text("node_name").notNull(), // Proxmox node where script is executed
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  startTime: timestamp("start_time", { withTimezone: true }).default(sql`now()`).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  output: text("output"), // Script output/logs
  errorOutput: text("error_output"), // Error messages
  exitCode: integer("exit_code"), // Process exit code
  duration: integer("duration"), // Execution duration in seconds
  createdBy: text("created_by"), // User who initiated execution
  metadata: text("metadata"), // JSON string for additional execution metadata
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

// Create insert schema for Proxmox servers (excluding auto-generated fields)
export const insertProxmoxServerSchema = createInsertSchema(proxmoxServers).omit({
  id: true,
  status: true,
  lastConnected: true,
  version: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
});

// Create update schema for Proxmox servers (all fields optional except id)
export const updateProxmoxServerSchema = createInsertSchema(proxmoxServers).partial().required({
  id: true,
});

// Create insert schema for script executions (excluding auto-generated fields)
export const insertScriptExecutionSchema = createInsertSchema(scriptExecutions).omit({
  id: true,
  startTime: true,
  endTime: true,
  createdAt: true,
  updatedAt: true,
});

// Create update schema for script executions (all fields optional except id)
export const updateScriptExecutionSchema = createInsertSchema(scriptExecutions).partial().required({
  id: true,
});

export type ProxmoxServer = typeof proxmoxServers.$inferSelect;
export type InsertProxmoxServer = z.infer<typeof insertProxmoxServerSchema>;
export type UpdateProxmoxServer = z.infer<typeof updateProxmoxServerSchema>;
export type Session = typeof sessions.$inferSelect;
export type ScriptExecution = typeof scriptExecutions.$inferSelect;
export type InsertScriptExecution = z.infer<typeof insertScriptExecutionSchema>;
export type UpdateScriptExecution = z.infer<typeof updateScriptExecutionSchema>;

// Zod schemas for API validation (kept for backward compatibility)
export const proxmoxServerValidationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Server name is required"),
  hostname: z.string().min(1, "Hostname is required"),
  port: z.number().min(1).max(65535, "Port must be between 1 and 65535"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  realm: z.string().default("pam"),
  useSSL: z.boolean().default(true),
  ignoreCert: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  status: z.enum(["connected", "disconnected", "testing", "error"]).default("disconnected"),
  lastConnected: z.string().optional(),
  version: z.string().optional(),
  errorMessage: z.string().optional(),
});

// API request validation schema
export const proxmoxServerRequestSchema = proxmoxServerValidationSchema.omit({
  id: true,
  status: true,
  lastConnected: true,
  version: true,
  errorMessage: true,
});

// Proxmox API response types
export const proxmoxVersionResponseSchema = z.object({
  release: z.string(),
  version: z.string(),
  repoid: z.string(),
});

export const proxmoxAuthResponseSchema = z.object({
  ticket: z.string(),
  CSRFPreventionToken: z.string(),
  username: z.string(),
  cap: z.object({}).optional(),
});

export type ProxmoxVersionResponse = z.infer<typeof proxmoxVersionResponseSchema>;
export type ProxmoxAuthResponse = z.infer<typeof proxmoxAuthResponseSchema>;

// Proxmox Node schema
export const proxmoxNodeSchema = z.object({
  node: z.string(),
  status: z.enum(["online", "offline"]),
  uptime: z.number(),
  cpu: z.number(),
  maxcpu: z.number(),
  mem: z.number(),
  maxmem: z.number(),
  disk: z.number(),
  maxdisk: z.number(),
  level: z.string(),
  ssl_fingerprint: z.string().optional(),
  type: z.literal("node"),
});

// Proxmox VM schema
export const proxmoxVMSchema = z.object({
  vmid: z.number(),
  name: z.string().optional(),
  status: z.enum(["running", "stopped", "suspended", "paused"]),
  node: z.string(),
  type: z.literal("qemu"),
  cpu: z.number().optional(),
  cpus: z.number().optional(),
  maxcpu: z.number().optional(),
  mem: z.number().optional(),
  maxmem: z.number().optional(),
  disk: z.number().optional(),
  maxdisk: z.number().optional(),
  uptime: z.number().optional(),
  netin: z.number().optional(),
  netout: z.number().optional(),
  diskread: z.number().optional(),
  diskwrite: z.number().optional(),
  template: z.boolean().optional(),
  tags: z.string().optional(),
  lock: z.string().optional(),
});

// Proxmox Container schema
export const proxmoxContainerSchema = z.object({
  vmid: z.number(),
  name: z.string().optional(),
  status: z.enum(["running", "stopped", "suspended", "paused"]),
  node: z.string(),
  type: z.literal("lxc"),
  cpu: z.number().optional(),
  cpus: z.number().optional(),
  maxcpu: z.number().optional(),
  mem: z.number().optional(),
  maxmem: z.number().optional(),
  disk: z.number().optional(),
  maxdisk: z.number().optional(),
  uptime: z.number().optional(),
  netin: z.number().optional(),
  netout: z.number().optional(),
  diskread: z.number().optional(),
  diskwrite: z.number().optional(),
  template: z.boolean().optional(),
  tags: z.string().optional(),
  lock: z.string().optional(),
});

// Proxmox Storage schema
export const proxmoxStorageSchema = z.object({
  storage: z.string(),
  type: z.string(),
  node: z.string(),
  content: z.string(),
  shared: z.boolean(),
  enabled: z.boolean(),
  used: z.number(),
  avail: z.number(),
  total: z.number(),
  used_fraction: z.number(),
});

// Proxmox Cluster Status schema
export const proxmoxClusterStatusSchema = z.object({
  type: z.enum(["cluster", "node"]),
  id: z.string(),
  name: z.string(),
  nodes: z.number().optional(),
  quorate: z.boolean().optional(),
  version: z.number().optional(),
  online: z.boolean().optional(),
  local: z.boolean().optional(),
  nodeid: z.number().optional(),
  level: z.string().optional(),
  ip: z.string().optional(),
});

// API Response wrapper schema
export const proxmoxApiResponseSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
  data: dataSchema,
  success: z.boolean().optional(),
  errors: z.array(z.string()).optional(),
});

export type ProxmoxNode = z.infer<typeof proxmoxNodeSchema>;
export type ProxmoxVM = z.infer<typeof proxmoxVMSchema>;
export type ProxmoxContainer = z.infer<typeof proxmoxContainerSchema>;
export type ProxmoxStorage = z.infer<typeof proxmoxStorageSchema>;
export type ProxmoxClusterStatus = z.infer<typeof proxmoxClusterStatusSchema>;
