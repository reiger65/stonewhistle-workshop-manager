import express from 'express';
import passport from 'passport';
import { db } from '../db/connection.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Invalid credentials' });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    });
  })(req, res, next);
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Register (if needed)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password (you'll need to implement this)
    const password_hash = password; // TODO: Hash the password
    
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        password_hash,
        role: 'user'
      })
      .returning();
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
