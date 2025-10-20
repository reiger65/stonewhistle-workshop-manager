import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with biometric and remember me support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // For WebAuthn / biometric authentication
  currentChallenge: text("current_challenge"),
  // For device registration and identification
  deviceId: text("device_id"),
  // For remember me functionality
  rememberToken: text("remember_token"),
  // Last login timestamp
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Order status enum based on the Excel workflow
export const orderStatusEnum = z.enum([
  "ordered",        // O
  "validated",      // V
  "building",       // BUILD
  "testing",        // TS
  "firing",         // 🔥
  "smoothing",      // SM
  "tuning1",        // T1
  "waxing",         // WAX
  "tuning2",        // T2
  "bagging",        // BAG
  "boxing",         // BOX
  "labeling",       // LAB
  "shipping",       // 📩
  "delivered",      // ➡️
  "completed",      // Fully processed and archived
  "cancelled"
]);

export type OrderStatus = z.infer<typeof orderStatusEnum>;

// Order type enum
export const orderTypeEnum = z.enum([
  "retail",
  "reseller",
  "custom"
]);

export type OrderType = z.infer<typeof orderTypeEnum>;

// Instrument types from spreadsheet
export const instrumentTypeEnum = z.enum([
  "INNATO_A3",
  "INNATO_B3",
  "INNATO_C3",
  "INNATO_F3",
  "INNATO_E3",
  "NATEY_A4",
  "NATEY_F#4",
  "NATEY_G#4",
  "NATEY_G3",
  "NATEY_C4",
  "DOUBLE_C4",
  "ZEN_M",
  "ZEN_L"
]);

export type InstrumentType = z.infer<typeof instrumentTypeEnum>;

// Instrument sizes from spreadsheet
export const instrumentSizeEnum = z.enum([
  "XL_35x35x30",
  "L_31x31x31",
  "S_15x15x15",
  "M_30x12x12",
  "B_20x20x20"
]);

export type InstrumentSize = z.infer<typeof instrumentSizeEnum>;

// Tuning types from spreadsheet
export const tuningTypeEnum = z.enum([
  "C",
  "B",
  "TB",
  "SB",
  "T"
]);

export type TuningType = z.infer<typeof tuningTypeEnum>;

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  shopifyOrderId: text("shopify_order_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  customerState: text("customer_state"),
  customerZip: text("customer_zip"),
  customerCountry: text("customer_country"),
  orderType: text("order_type").notNull(),
  isReseller: boolean("is_reseller").default(false),
  resellerNickname: text("reseller_nickname"),
  status: text("status").notNull().default("ordered"),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  deadline: timestamp("deadline"),
  notes: text("notes"),
  progress: integer("progress").default(0),
  specifications: json("specifications"),
  statusChangeDates: json("status_change_dates").default({}),
  buildDate: timestamp("build_date"),
  archived: boolean("archived").default(false),
  // Shipping and tracking information
  trackingNumber: text("tracking_number"),
  trackingCompany: text("tracking_company"),
  trackingUrl: text("tracking_url"),
  shippedDate: timestamp("shipped_date"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  deliveryStatus: text("delivery_status"),
  deliveredDate: timestamp("delivered_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    orderType: orderTypeEnum,
    status: orderStatusEnum,
    deadline: z.union([z.string(), z.date(), z.null()]).optional(),
    orderDate: z.union([z.string(), z.date()]).optional(),
    specifications: z.record(z.string(), z.string()).optional(),
    statusChangeDates: z.record(z.string(), z.union([z.string(), z.date()])).optional()
  });

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect & {
  statusChangeDates?: Record<string, string | Date>;
  shippingAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  };
  title?: string;
  tuning?: string;
  color?: string;
  items?: OrderItem[];
};

// Order items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  itemType: text("item_type").notNull(),
  itemSize: text("item_size"),
  tuningType: text("tuning_type"),
  color: text("color"),
  weight: text("weight"),
  craftsperson: text("craftsperson"),
  // Additional fields from spreadsheet
  orderNumber: text("order_number"), // Original order number reference
  orderDate: timestamp("order_date"),
  deadline: timestamp("deadline"),
  buildDate: timestamp("build_date"),
  bagSize: text("bag_size"), // Add bag size field 
  boxSize: text("box_size"), // Add box size field
  specifications: json("specifications"),
  status: text("status").notNull().default("ordered"),
  progress: integer("progress").default(0),
  statusChangeDates: json("status_change_dates").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    itemType: z.string(), // Allow text or enum
    itemSize: z.string().optional(),
    tuningType: z.string().optional(),
    bagSize: z.string().optional(),
    boxSize: z.string().optional(),
    status: orderStatusEnum,
    specifications: z.record(z.string(), z.string()).optional(),
    orderDate: z.union([z.string(), z.date(), z.null()]).optional(),
    deadline: z.union([z.string(), z.date(), z.null()]).optional(),
    statusChangeDates: z.record(z.string(), z.union([z.string(), z.date()])).optional()
  });

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect & {
  statusChangeDates?: Record<string, string | Date>;
  title?: string;
  tuning?: string;
  specifications?: Record<string, string>;
};

// Production notes schema
export const productionNotes = pgTable("production_notes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  itemId: integer("item_id"),
  note: text("note").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductionNoteSchema = createInsertSchema(productionNotes)
  .omit({ id: true, createdAt: true });

export type InsertProductionNote = z.infer<typeof insertProductionNoteSchema>;
export type ProductionNote = typeof productionNotes.$inferSelect;

// Materials inventory and mapping

// Bag sizes
export const bagSizeEnum = z.enum([
  "S", "M", "L", "XL", "XXL", "Bagpack"
]);
export type BagSize = z.infer<typeof bagSizeEnum>;

// Box sizes
export const boxSizeEnum = z.enum([
  "15x15x15", "20x20x20", "30x12x12", "30x30x30", 
  "35x35x30", "35x35x35", "40x40x40", "40x40x40 (2)", "50x50x50"
]);
export type BoxSize = z.infer<typeof boxSizeEnum>;

// Bag types
export const bagTypeEnum = z.enum([
  "Innato", "Natey", "ZEN", "Double", "OvA"
]);
export type BagType = z.infer<typeof bagTypeEnum>;

// Materials inventory - track stock levels of bags and boxes
export const materialsInventory = pgTable("materials_inventory", {
  id: serial("id").primaryKey(),
  materialName: text("material_name").notNull(), // e.g., "Innato bag L", "Box 30x30x30"
  materialType: text("material_type").notNull(), // "bag" or "box"
  bagType: text("bag_type"), // Only for bags: Innato, Natey, etc.
  size: text("size").notNull(), // S, M, L, XL, XXL or box dimensions
  quantity: integer("quantity").notNull().default(0),
  reorderPoint: integer("reorder_point").default(5),
  ordered: integer("ordered").default(0), // Quantity that has been ordered but not received
  expectedDelivery: timestamp("expected_delivery"), // When the ordered materials are expected to arrive
  orderDate: timestamp("order_date"), // When the materials were ordered
  orderReference: text("order_reference"), // Reference number for the order
  displayOrder: integer("display_order").default(0), // Used for custom ordering
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
});

export const insertMaterialInventorySchema = createInsertSchema(materialsInventory)
  .omit({ id: true, lastUpdated: true });

export type InsertMaterialInventory = z.infer<typeof insertMaterialInventorySchema>;
export type MaterialInventory = typeof materialsInventory.$inferSelect;

// Instrument inventory - track instruments in stock
export const instrumentInventory = pgTable("instrument_inventory", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(), // Internal serial number for stock items
  instrumentType: text("instrument_type").notNull(), // INNATO, NATEY, etc.
  tuningType: text("tuning_type"), // C, B, TB, SB, T
  color: text("color"),
  dateProduced: timestamp("date_produced"),
  status: text("status").notNull().default("available"), // available, reserved, etc.
  location: text("location"), // Where the instrument is stored
  craftsperson: text("craftsperson"),
  notes: text("notes"),
  price: integer("price"), // Price in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const insertInstrumentInventorySchema = createInsertSchema(instrumentInventory)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertInstrumentInventory = z.infer<typeof insertInstrumentInventorySchema>;
export type InstrumentInventory = typeof instrumentInventory.$inferSelect;

// Material mapping rules - which instrument gets which bag/box
export const materialMappingRules = pgTable("material_mapping_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Name of the rule for display
  instrumentType: text("instrument_type").notNull(), // INNATO, NATEY, etc.
  instrumentSize: text("instrument_size"), // Optional specific size
  tuningNote: text("tuning_note"), // Optional specific tuning
  bagType: text("bag_type").notNull(), // Innato, Natey, etc.
  bagSize: text("bag_size").notNull(), // S, M, L, XL, XXL, Bagpack
  boxSize: text("box_size").notNull(), // Box dimensions
  priority: integer("priority").default(0), // Higher priority rules are applied first
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMaterialMappingRuleSchema = createInsertSchema(materialMappingRules)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertMaterialMappingRule = z.infer<typeof insertMaterialMappingRuleSchema>;
export type MaterialMappingRule = typeof materialMappingRules.$inferSelect;

// Mold inventory management
export const moldInventory = pgTable("mold_inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Name of the mold (e.g., "Innato 25" for a 25cm Innato mold)
  size: text("size").default(""), // Size in cm (e.g., "25", "19", "17") - now optional
  instrumentType: text("instrument_type").notNull(), // INNATO, NATEY, ZEN, etc.
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMoldInventorySchema = createInsertSchema(moldInventory)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    size: z.string().optional().default(""),
  });

export type InsertMoldInventory = z.infer<typeof insertMoldInventorySchema>;
export type MoldInventory = typeof moldInventory.$inferSelect;

// Mapping between instrument tunings and the molds required to build them
export const moldMappings = pgTable("mold_mappings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Name of mapping for display (e.g., "Innato A3 Molds")
  instrumentType: text("instrument_type").notNull(), // INNATO, NATEY, ZEN, etc.
  tuningNote: text("tuning_note").notNull(), // A3, C4, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMoldMappingSchema = createInsertSchema(moldMappings)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertMoldMapping = z.infer<typeof insertMoldMappingSchema>;
export type MoldMapping = typeof moldMappings.$inferSelect;

// Many-to-many relationship between moldMappings and moldInventory
export const moldMappingItems = pgTable("mold_mapping_items", {
  id: serial("id").primaryKey(),
  mappingId: integer("mapping_id").notNull(),
  moldId: integer("mold_id").notNull(),
  orderIndex: integer("order_index").default(0), // For ordering molds in the sequence they should be used
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMoldMappingItemSchema = createInsertSchema(moldMappingItems)
  .omit({ id: true, createdAt: true });

export type InsertMoldMappingItem = z.infer<typeof insertMoldMappingItemSchema>;
export type MoldMappingItem = typeof moldMappingItems.$inferSelect;

// Flute settings schema for the tuner configurations
export const fluteSettings = pgTable("flute_settings", {
  id: serial("id").primaryKey(),
  instrumentType: text("instrument_type").notNull(),
  tuningNote: text("tuning_note").notNull(),
  frequency: integer("frequency").default(440),
  description: text("description"),
  sensitivityThreshold: text("sensitivity_threshold").default("0.0001"),
  adjustedNotes: json("adjusted_notes").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFluteSettingsSchema = createInsertSchema(fluteSettings)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertFluteSettings = z.infer<typeof insertFluteSettingsSchema>;
export type FluteSettings = typeof fluteSettings.$inferSelect;
