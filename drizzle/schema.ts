import { pgTable, serial, text, timestamp, integer, jsonb, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  order_number: text('order_number').notNull().unique(),
  shopify_order_id: text('shopify_order_id'),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email'),
  customer_phone: text('customer_phone'),
  customer_address: text('customer_address'),
  customer_city: text('customer_city'),
  customer_state: text('customer_state'),
  customer_zip: text('customer_zip'),
  customer_country: text('customer_country'),
  order_type: text('order_type'),
  is_reseller: boolean('is_reseller'),
  reseller_nickname: text('reseller_nickname'),
  status: text('status').notNull().default('pending'),
  order_date: timestamp('order_date'),
  deadline: timestamp('deadline'),
  notes: text('notes'),
  progress: integer('progress'),
  specifications: jsonb('specifications'),
  status_change_dates: jsonb('status_change_dates'),
  build_date: timestamp('build_date'),
  archived: boolean('archived'),
  tracking_number: text('tracking_number'),
  tracking_company: text('tracking_company'),
  tracking_url: text('tracking_url'),
  shipped_date: timestamp('shipped_date'),
  estimated_delivery_date: timestamp('estimated_delivery_date'),
  delivery_status: text('delivery_status'),
  delivered_date: timestamp('delivered_date'),
  is_urgent: boolean('is_urgent'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  serial_number: text('serial_number').notNull().unique(),
  item_type: text('item_type').notNull(),
  item_size: text('item_size'),
  tuning_type: text('tuning_type'),
  color: text('color'),
  weight: text('weight'),
  craftsperson: text('craftsperson'),
  order_number: text('order_number'),
  order_date: timestamp('order_date'),
  deadline: timestamp('deadline'),
  build_date: timestamp('build_date'),
  bag_size: text('bag_size'),
  box_size: text('box_size'),
  shopify_line_item_id: text('shopify_line_item_id'),
  specifications: jsonb('specifications'),
  status: text('status').notNull().default('ordered'),
  progress: integer('progress'),
  status_change_dates: jsonb('status_change_dates'),
  is_archived: boolean('is_archived'),
  archived_reason: text('archived_reason'),
  workshop_notes: text('workshop_notes'),
  // CamelCase aliases for frontend compatibility
  workshopNotes: text('workshop_notes'),
  orderDate: timestamp('order_date'),
  buildDate: timestamp('build_date'),
  statusChangeDates: jsonb('status_change_dates'),
  isArchived: boolean('is_archived'),
  archivedReason: text('archived_reason'),
  orderNumber: text('order_number'),
  orderId: integer('order_id'),
  serialNumber: text('serial_number'),
  itemType: text('item_type'),
  itemSize: text('item_size'),
  tuningType: text('tuning_type'),
  bagSize: text('bag_size'),
  boxSize: text('box_size'),
  shopifyLineItemId: text('shopify_line_item_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Production notes table
export const productionNotes = pgTable('production_notes', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  item_id: integer('item_id').references(() => orderItems.id),
  note_text: text('note_text').notNull(),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
});

// Materials inventory table
export const materialsInventory = pgTable('materials_inventory', {
  id: serial('id').primaryKey(),
  material_name: text('material_name').notNull(),
  material_type: text('material_type').notNull(),
  quantity_available: decimal('quantity_available', { precision: 10, scale: 2 }),
  unit: text('unit').notNull(),
  supplier: text('supplier'),
  cost_per_unit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
  last_updated: timestamp('last_updated').defaultNow(),
});

// Instrument inventory table
export const instrumentInventory = pgTable('instrument_inventory', {
  id: serial('id').primaryKey(),
  instrument_name: text('instrument_name').notNull(),
  instrument_type: text('instrument_type').notNull(),
  serial_number: text('serial_number').unique(),
  status: text('status').notNull().default('available'),
  location: text('location'),
  last_used: timestamp('last_used'),
  created_at: timestamp('created_at').defaultNow(),
});

// Mold inventory table
export const moldInventory = pgTable('mold_inventory', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  size: text('size'),
  instrument_type: text('instrument_type').notNull(),
  is_active: boolean('is_active').default(true),
  notes: text('notes'),
  last_used: timestamp('last_used'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Mold mappings table
export const moldMappings = pgTable('mold_mappings', {
  id: serial('id').primaryKey(),
  mapping_name: text('mapping_name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
});

// Mold mapping items table
export const moldMappingItems = pgTable('mold_mapping_items', {
  id: serial('id').primaryKey(),
  mapping_id: integer('mapping_id').notNull().references(() => moldMappings.id),
  mold_id: integer('mold_id').notNull().references(() => moldInventory.id),
  order: integer('order').notNull(),
});

// Material mapping rules table
export const materialMappingRules = pgTable('material_mapping_rules', {
  id: serial('id').primaryKey(),
  rule_name: text('rule_name').notNull(),
  material_id: integer('material_id').notNull().references(() => materialsInventory.id),
  instrument_type: text('instrument_type').notNull(),
  quantity_needed: decimal('quantity_needed', { precision: 10, scale: 2 }),
  created_at: timestamp('created_at').defaultNow(),
});

// Timesheets table
export const timesheets = pgTable('timesheets', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  order_id: integer('order_id').references(() => orders.id),
  item_id: integer('item_id').references(() => orderItems.id),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time'),
  task_description: text('task_description'),
  created_at: timestamp('created_at').defaultNow(),
});

// Shopify item tracking table
export const shopifyItemTracking = pgTable('shopify_item_tracking', {
  id: serial('id').primaryKey(),
  shopify_item_id: text('shopify_item_id').notNull(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  item_id: integer('item_id').notNull().references(() => orderItems.id),
  tracking_status: text('tracking_status').notNull(),
  last_synced: timestamp('last_synced').defaultNow(),
});

// Resellers table
export const resellers = pgTable('resellers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contact_email: text('contact_email'),
  contact_phone: text('contact_phone'),
  address: text('address'),
  commission_rate: decimal('commission_rate', { precision: 5, scale: 2 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

// Session table (for authentication)
export const session = pgTable('session', {
  sid: text('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  notes: many(productionNotes),
  timesheets: many(timesheets),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.order_id],
    references: [orders.id],
  }),
  notes: many(productionNotes),
  timesheets: many(timesheets),
}));

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(productionNotes),
  timesheets: many(timesheets),
}));
