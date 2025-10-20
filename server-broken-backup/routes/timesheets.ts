import express from 'express';
import { db } from '../db/connection.js';
import { timesheets } from '../../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Get all timesheets
router.get('/', async (req, res) => {
  try {
    const allTimesheets = await db
      .select()
      .from(timesheets)
      .orderBy(desc(timesheets.created_at));
    
    res.json(allTimesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

// Create new timesheet entry
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      order_id,
      item_id,
      start_time,
      end_time,
      task_description
    } = req.body;
    
    const [newTimesheet] = await db
      .insert(timesheets)
      .values({
        user_id,
        order_id,
        item_id,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : null,
        task_description
      })
      .returning();
    
    res.status(201).json(newTimesheet);
  } catch (error) {
    console.error('Error creating timesheet:', error);
    res.status(500).json({ error: 'Failed to create timesheet' });
  }
});

export default router;
