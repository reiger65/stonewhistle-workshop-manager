import express from 'express';
import { db } from '../db/connection.js';
import { materialsInventory, instrumentInventory, moldInventory } from '../../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Materials inventory routes
router.get('/materials', async (req, res) => {
  try {
    const materials = await db
      .select()
      .from(materialsInventory)
      .orderBy(desc(materialsInventory.last_updated));
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get materials by type (e.g., /api/materials/type/box)
router.get('/materials/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const materials = await db
      .select()
      .from(materialsInventory)
      .where(eq(materialsInventory.material_type, type))
      .orderBy(desc(materialsInventory.last_updated));
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials by type:', error);
    res.status(500).json({ error: 'Failed to fetch materials by type' });
  }
});

// Instruments inventory routes
router.get('/instruments', async (req, res) => {
  try {
    const instruments = await db
      .select()
      .from(instrumentInventory)
      .orderBy(desc(instrumentInventory.created_at));
    
    res.json(instruments);
  } catch (error) {
    console.error('Error fetching instruments:', error);
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

// Molds inventory routes
router.get('/molds', async (req, res) => {
  try {
    const molds = await db
      .select()
      .from(moldInventory)
      .orderBy(desc(moldInventory.created_at));
    
    res.json(molds);
  } catch (error) {
    console.error('Error fetching molds:', error);
    res.status(500).json({ error: 'Failed to fetch molds' });
  }
});

export default router;
