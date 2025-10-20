import express from 'express';
import { storage } from '../storage';
import { insertResellerSchema } from '@shared/schema';
import { z } from 'zod';

const router = express.Router();

// Get all resellers
router.get('/', async (req, res) => {
  try {
    const resellers = await storage.getAllResellers();
    res.json(resellers);
  } catch (error) {
    console.error('Error fetching resellers:', error);
    res.status(500).json({ error: 'Failed to fetch resellers' });
  }
});

// Get active resellers only
router.get('/active', async (req, res) => {
  try {
    const resellers = await storage.getActiveResellers();
    res.json(resellers);
  } catch (error) {
    console.error('Error fetching active resellers:', error);
    res.status(500).json({ error: 'Failed to fetch active resellers' });
  }
});

// Get a specific reseller by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid reseller ID' });
    }
    
    const reseller = await storage.getResellerById(id);
    if (!reseller) {
      return res.status(404).json({ error: 'Reseller not found' });
    }
    
    res.json(reseller);
  } catch (error) {
    console.error('Error fetching reseller:', error);
    res.status(500).json({ error: 'Failed to fetch reseller' });
  }
});

// Create a new reseller
router.post('/', async (req, res) => {
  try {
    // Validate the request body
    const resellerData = insertResellerSchema.parse(req.body);
    
    // Create the reseller
    const reseller = await storage.createReseller(resellerData);
    res.status(201).json(reseller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating reseller:', error);
    res.status(500).json({ error: 'Failed to create reseller' });
  }
});

// Update a reseller
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid reseller ID' });
    }
    
    // Ensure the reseller exists
    const existingReseller = await storage.getResellerById(id);
    if (!existingReseller) {
      return res.status(404).json({ error: 'Reseller not found' });
    }
    
    // Validate the update data (allowing partial updates)
    const updateData = insertResellerSchema.partial().parse(req.body);
    
    // Update the reseller
    const updatedReseller = await storage.updateReseller(id, updateData);
    res.json(updatedReseller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating reseller:', error);
    res.status(500).json({ error: 'Failed to update reseller' });
  }
});

// Delete a reseller
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid reseller ID' });
    }
    
    // Ensure the reseller exists
    const existingReseller = await storage.getResellerById(id);
    if (!existingReseller) {
      return res.status(404).json({ error: 'Reseller not found' });
    }
    
    // Delete the reseller
    const result = await storage.deleteReseller(id);
    if (result) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Failed to delete reseller' });
    }
  } catch (error) {
    console.error('Error deleting reseller:', error);
    res.status(500).json({ error: 'Failed to delete reseller' });
  }
});

export default router;