import express from 'express';
import { db } from '../db/connection.js';
import { orders } from '../../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Get all resellers - extract from orders
router.get('/', async (req, res) => {
  try {
    // Get all orders and extract unique resellers
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.is_reseller, true))
      .orderBy(desc(orders.created_at));
    
    // Extract unique resellers
    const resellersMap = new Map();
    
    allOrders.forEach((order) => {
      if (order.reseller_nickname && order.reseller_nickname.trim() !== '') {
        resellersMap.set(order.reseller_nickname, {
          id: order.reseller_nickname,
          nickname: order.reseller_nickname,
          name: order.customer_name,
          email: order.customer_email
        });
      }
    });
    
    const resellers = Array.from(resellersMap.values());
    
    res.json(resellers);
  } catch (error) {
    console.error('Error fetching resellers:', error);
    res.status(500).json({ error: 'Failed to fetch resellers' });
  }
});

// Get active resellers only
router.get('/active', async (req, res) => {
  try {
    // For now, return the same as all resellers
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.is_reseller, true))
      .orderBy(desc(orders.created_at));
    
    // Extract unique resellers
    const resellersMap = new Map();
    
    allOrders.forEach((order) => {
      if (order.reseller_nickname && order.reseller_nickname.trim() !== '') {
        resellersMap.set(order.reseller_nickname, {
          id: order.reseller_nickname,
          nickname: order.reseller_nickname,
          name: order.customer_name,
          email: order.customer_email
        });
      }
    });
    
    const resellers = Array.from(resellersMap.values());
    
    res.json(resellers);
  } catch (error) {
    console.error('Error fetching active resellers:', error);
    res.status(500).json({ error: 'Failed to fetch active resellers' });
  }
});

export default router;