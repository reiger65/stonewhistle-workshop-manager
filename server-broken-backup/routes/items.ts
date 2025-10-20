import express from 'express';
import { db } from '../db/connection.js';
import { orderItems, productionNotes, orders } from '../../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Get all items - extract from orders
router.get('/', async (req, res) => {
  try {
    // Get all orders and extract items from them
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.created_at));
    
    // Transform orders into items
    const items = allOrders.map(order => ({
      id: order.id,
      order_id: order.id,
      serial_number: order.order_number,
      instrument_type: order.specifications?.type || 'Unknown',
      color_code: order.specifications?.color || 'Unknown',
      status: order.status || 'ordered',
      production_stage: order.status || 'ordered',
      specifications: order.specifications,
      created_at: order.created_at,
      updated_at: order.updated_at,
      // Add additional fields that might be needed
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      order_type: order.order_type,
      is_reseller: order.is_reseller,
      reseller_nickname: order.reseller_nickname,
      archived: order.archived
    }));
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get items by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, orderId));
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching items for order:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    
    const item = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, itemId))
      .limit(1);
    
    if (item.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Get production notes for this item
    const notes = await db
      .select()
      .from(productionNotes)
      .where(eq(productionNotes.item_id, itemId));
    
    res.json({
      ...item[0],
      notes
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new item
router.post('/', async (req, res) => {
  try {
    const {
      order_id,
      serial_number,
      instrument_type,
      color_code,
      status,
      production_stage,
      specifications
    } = req.body;
    
    const [newItem] = await db
      .insert(orderItems)
      .values({
        order_id,
        serial_number,
        instrument_type,
        color_code,
        status: status || 'ordered',
        production_stage: production_stage || 'ordered',
        specifications
      })
      .returning();
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
router.patch('/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const updateData = req.body;
    
    const [updatedItem] = await db
      .update(orderItems)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(orderItems.id, itemId))
      .returning();
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    
    // Delete related production notes first
    await db.delete(productionNotes).where(eq(productionNotes.item_id, itemId));
    
    // Delete item
    const [deletedItem] = await db
      .delete(orderItems)
      .where(eq(orderItems.id, itemId))
      .returning();
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
