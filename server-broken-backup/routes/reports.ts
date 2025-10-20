import express from 'express';
import { db } from '../db/connection.js';
import { orders, orderItems, timesheets } from '../../drizzle/schema.js';
import { eq, desc, gte, lte } from 'drizzle-orm';

const router = express.Router();

// Get production report
router.get('/production', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = db.select().from(orders);
    
    if (startDate && endDate) {
      query = query.where(
        gte(orders.created_at, new Date(startDate as string))
      ).where(
        lte(orders.created_at, new Date(endDate as string))
      );
    }
    
    const ordersData = await query.orderBy(desc(orders.created_at));
    
    res.json({
      totalOrders: ordersData.length,
      orders: ordersData
    });
  } catch (error) {
    console.error('Error generating production report:', error);
    res.status(500).json({ error: 'Failed to generate production report' });
  }
});

// Get timesheet report
router.get('/timesheets', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = db.select().from(timesheets);
    
    if (startDate && endDate) {
      query = query.where(
        gte(timesheets.start_time, new Date(startDate as string))
      ).where(
        lte(timesheets.start_time, new Date(endDate as string))
      );
    }
    
    const timesheetData = await query.orderBy(desc(timesheets.start_time));
    
    res.json({
      totalEntries: timesheetData.length,
      timesheets: timesheetData
    });
  } catch (error) {
    console.error('Error generating timesheet report:', error);
    res.status(500).json({ error: 'Failed to generate timesheet report' });
  }
});

export default router;
