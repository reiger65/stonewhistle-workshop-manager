import express from 'express';
import { db } from '../db/connection.js';
import { orders, orderItems, productionNotes } from '../../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.created_at));
    
    res.json(allOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    if (order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, orderId));
    
    // Get production notes
    const notes = await db
      .select()
      .from(productionNotes)
      .where(eq(productionNotes.order_id, orderId));
    
    res.json({
      ...order[0],
      items,
      notes
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      order_number,
      shopify_order_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_city,
      customer_state,
      customer_zip,
      status,
      total_amount,
      notes,
      items
    } = req.body;
    
    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        order_number,
        shopify_order_id,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        customer_city,
        customer_state,
        customer_zip,
        status: status || 'pending',
        total_amount,
        notes
      })
      .returning();
    
    // Create order items if provided
    if (items && items.length > 0) {
      const itemData = items.map((item: any) => ({
        order_id: newOrder.id,
        serial_number: item.serial_number,
        instrument_type: item.instrument_type,
        color_code: item.color_code,
        status: item.status || 'ordered',
        production_stage: item.production_stage || 'ordered',
        specifications: item.specifications
      }));
      
      await db.insert(orderItems).values(itemData);
    }
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.patch('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const updateData = req.body;
    
    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Delete related records first
    await db.delete(productionNotes).where(eq(productionNotes.order_id, orderId));
    await db.delete(orderItems).where(eq(orderItems.order_id, orderId));
    
    // Delete order
    const [deletedOrder] = await db
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning();
    
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
