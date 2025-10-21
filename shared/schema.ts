import { pgTable, text, serial, integer, boolean, timestamp, json, foreignKey } from "drizzle-orm/pg-core";
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
  "terrasigillata", // TS (Terra Sigillata)
  "firing",         // 🔥
  "smokefiring",    // SM (Smokefiring)
  "smoothing",      // SM (oude naam behouden voor compatibiliteit)
  "tuning1",        // T1
  "waxing",         // WAX
  "tuning2",        // T2
  "bagging",        // BAG
  "boxing",         // BOX
  "labeling",       // LAB
  "shipping",       // 📩
  "delivered",      // ➡️
  "completed",      // Fully processed and archived
  "cancelled",      // Cancelled
  "archived"        // Automatically archived during shopify sync
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
  // Urgent order marking
  isUrgent: boolean("is_urgent").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = z.object({
  orderNumber: z.string(),
  shopifyOrderId: z.string().optional(),
  customerName: z.string(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerState: z.string().optional(),
  customerZip: z.string().optional(),
  customerCountry: z.string().optional(),
  orderType: orderTypeEnum,
  isReseller: z.boolean().optional(),
  resellerNickname: z.string().optional(),
  status: orderStatusEnum.optional(),
  orderDate: z.union([z.string(), z.date()]).optional(),
  deadline: z.union([z.string(), z.date(), z.null()]).optional(),
  notes: z.string().optional(),
  progress: z.number().optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  statusChangeDates: z.record(z.string(), z.union([z.string(), z.date()])).optional(),
  buildDate: z.union([z.string(), z.date(), z.null()]).optional(),
  trackingNumber: z.string().optional(),
  trackingCompany: z.string().optional(),
  trackingUrl: z.string().optional(),
  shippedDate: z.union([z.string(), z.date(), z.null()]).optional(),
  estimatedDeliveryDate: z.union([z.string(), z.date(), z.null()]).optional(),
  deliveryStatus: z.string().optional(),
  deliveredDate: z.union([z.string(), z.date(), z.null()]).optional(),
  isUrgent: z.boolean().optional(),
  archived: z.boolean().optional()
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
  shopifyLineItemId: text("shopify_line_item_id"), // Unieke Shopify line item ID voor permanente koppeling
  specifications: json("specifications"),
  status: text("status").notNull().default("ordered"),
  progress: integer("progress").default(0),
  statusChangeDates: json("status_change_dates").default({}),
  // Archiving-related fields
  isArchived: boolean("is_archived").default(false),  // Flag voor gearchiveerde items
  archivedReason: text("archived_reason"),            // Reden waarom het item is gearchiveerd
  // Workshop notes field
  workshopNotes: text("workshop_notes"),              // Workshop notes for individual items
  // Timestamps
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
    statusChangeDates: z.record(z.string(), z.union([z.string(), z.date()])).optional(),
    isArchived: z.boolean().optional().default(false),
    archivedReason: z.string().optional()
  });

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect & {
  statusChangeDates?: Record<string, string | Date>;
  title?: string;
  tuning?: string;
  specifications?: Record<string, string>;
  isArchived?: boolean;  // Toegevoegd voor archivering
  archivedReason?: string; // Toegevoegd voor archivering
};

// Production notes schema
export const productionNotes = pgTable("production_notes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  itemId: integer("item_id"),
  note: text("note").notNull(),
  createdBy: text("created_by").notNull(),
  source: text("source").default("internal"), // 'internal' of 'shopify'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductionNoteSchema = createInsertSchema(productionNotes)
  .omit({ id: true, createdAt: true })
  .extend({
    source: z.enum(['internal', 'shopify']).default('internal')
  });

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

// Flute settings schema is verwijderd omdat het alleen voor de tuner was

// Reseller schema for managing reseller information
export const resellers = pgTable("resellers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname").notNull().unique(),
  businessName: text("business_name"),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country").default("US"),
  discountPercentage: integer("discount_percentage").default(0),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  lastOrderDate: timestamp("last_order_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResellerSchema = createInsertSchema(resellers)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertReseller = z.infer<typeof insertResellerSchema>;
export type Reseller = typeof resellers.$inferSelect;

// Add references to establish relationships between tables
export const orderItemsRelations = {
  order: {
    columns: [orderItems.orderId],
    foreignColumns: [orders.id]
  }
};

export const productionNotesRelations = {
  order: {
    columns: [productionNotes.orderId],
    foreignColumns: [orders.id]
  },
  orderItem: {
    columns: [productionNotes.itemId],
    foreignColumns: [orderItems.id]
  }
};

export const moldMappingItemsRelations = {
  mapping: {
    columns: [moldMappingItems.mappingId],
    foreignColumns: [moldMappings.id]
  },
  mold: {
    columns: [moldMappingItems.moldId],
    foreignColumns: [moldInventory.id]
  }
};

// Shopify item tracking schema
// Dit wordt gebruikt om de suffix (serialnummer) van items bij te houden, zelfs als ze verwijderd worden
export const shopifyItemTracking = pgTable("shopify_item_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(), // Koppeling naar onze order tabel
  usedSuffixes: json("used_suffixes").default([]), // Array van gebruikte suffixen (nummers)
  itemMappings: json("item_mappings").default([]), // Array van {shopifyLineItemId, suffix, title}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShopifyItemTrackingSchema = createInsertSchema(shopifyItemTracking)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertShopifyItemTracking = z.infer<typeof insertShopifyItemTrackingSchema>;
export type ShopifyItemTracking = typeof shopifyItemTracking.$inferSelect & {
  usedSuffixes: number[];
  itemMappings: Array<{
    shopifyLineItemId: string;
    suffix: number;
    title: string;
  }>;
};

// Timesheet schema for tracking work hours
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  employeeName: text("employee_name").notNull(), // "Hans", "Tara", "Mariena"
  workDate: timestamp("work_date").notNull().defaultNow(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  totalTimeMinutes: integer("total_time_minutes"), // total time including breaks (in minutes)
  breakTimeMinutes: integer("break_time_minutes").default(0), // break time in minutes
  workedTimeMinutes: integer("worked_time_minutes"), // actual worked time (total - break)
  hourlyRate: integer("hourly_rate").default(1500), // in cents (€15.00 = 1500 cents)
  totalAmount: integer("total_amount"), // in cents (based on worked time)
  isPaid: boolean("is_paid").default(false),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheets);
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheets.$inferSelect;
