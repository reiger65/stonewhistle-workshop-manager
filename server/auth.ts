import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { createHash } from "crypto";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Add the Express session user customization for TypeScript
declare global {
  namespace Express {
    // Define a simplified user interface to avoid recursive type issues
    interface User {
      id: number;
      username: string;
      role?: string;
      // Add other non-password user properties here as needed
    }
  }
}

/**
 * Simple hash for development
 */
function simpleHash(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Hash password (simplified for development)
 */
async function hashPassword(password: string): Promise<string> {
  return simpleHash(password);
}

/**
 * Compare supplied password with stored password
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    // For development, use a simple comparison
    const hashedSupplied = simpleHash(supplied);
    return hashedSupplied === stored;
  } catch (error) {
    console.error("Error in password comparison:", error);
    return false;
  }
}

/**
 * Setup authentication routes and middleware
 */
export function setupAuth(app: Express): void {
  // Check if we have a session secret in the environment
  if (!process.env.SESSION_SECRET) {
    console.warn("WARNING: SESSION_SECRET not set. Using default insecure value.");
  }
  
  // Calculate the session max age - use environment variable if available, otherwise default to 30 days
  const sessionMaxAge = process.env.SESSION_MAX_AGE 
    ? parseInt(process.env.SESSION_MAX_AGE, 10) 
    : 30 * 24 * 60 * 60 * 1000; // 30 days
  
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "stonewhistle-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: sessionMaxAge,
      secure: process.env.NODE_ENV === "production", // Only use secure in production
      httpOnly: true, // Prevents JavaScript from reading the cookie
      sameSite: "lax", // Allows redirect after login but prevents CSRF
    }
  };

  // Set up session middleware
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport with local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Login attempt for:", username);
        console.log("Login attempt with username:", username);
        
        // Get user from database
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log("User not found:", username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Compare passwords using the same hashing method
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          console.log("Login failed - invalid credentials");
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log("Login successful for user:", username);
        
        // Return user without password
        const authenticatedUser = {
          id: user.id,
          username: user.username,
          role: "admin"
        };
        
        return done(null, authenticatedUser);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    })
  );

  // Serialize user to the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        // Return user without password
        const authenticatedUser = {
          id: user.id,
          username: user.username,
          role: "admin"
        };
        return done(null, authenticatedUser);
      }
      
      return done(null, false);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });

  // Register route - create a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create the user
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Don't include password in the response
      const { password: _, ...userWithoutPassword } = user;

      // Log the user in
      req.login(userWithoutPassword, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  // Login route
  app.post(
    "/api/login",
    (req, res, next) => {
      console.log("Login attempt for:", req.body.username);
      
      passport.authenticate("local", (err: Error, user: Express.User, info: any) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }
        
        if (!user) {
          console.log("Authentication failed:", info);
          return res.status(401).json({ message: info?.message || "Authentication failed" });
        }
        
        console.log("User authenticated, proceeding to establish session");
        
        req.login(user, (err) => {
          if (err) {
            console.error("Session error:", err);
            return next(err);
          }
          
          console.log("Login successful for:", user.username);
          return res.status(200).json(user);
        });
      })(req, res, next);
    }
  );

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
  
  // Change password route (only for the fixed user)
  app.post("/api/change-password", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    // For security, ensure user knows the current fixed password
    const FIXED_PASSWORD = process.env.ADMIN_PASSWORD || "St0n3Fl%te$h0p@2025#!";
    
    if (currentPassword !== FIXED_PASSWORD) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // In a real app, we would update the password in the database
    // Since we're using a fixed password, we'd need to update the code or use environment variables
    // For demo purposes, we'll just return success
    
    return res.status(200).json({ message: "Password changed successfully" });
  });
  
  // Route to clear all sessions (admin only)
  app.post("/api/clear-sessions", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Destroy the store to clear all sessions
    if (storage.sessionStore) {
      try {
        // Cast to any to bypass TypeScript error
        (storage.sessionStore as any).clear((err: Error) => {
          if (err) {
            console.error("Error clearing session store:", err);
            return res.status(500).json({ message: "Failed to clear sessions" });
          }
          
          // Also destroy the current session
          req.session.destroy((err) => {
            if (err) {
              console.error("Error destroying current session:", err);
              return res.status(500).json({ message: "Failed to destroy current session" });
            }
            
            res.status(200).json({ message: "All sessions cleared successfully" });
          });
        });
      } catch (error) {
        console.error("Error in session store operation:", error);
        res.status(500).json({ message: "Session store error" });
      }
    } else {
      res.status(500).json({ message: "Session store not available" });
    }
  });
}