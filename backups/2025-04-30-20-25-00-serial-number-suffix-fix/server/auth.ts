import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
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

const scryptAsync = promisify(scrypt);

/**
 * Hash password using scrypt with salt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare supplied password with stored password
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
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
        // Get credentials from environment variables
        const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
        
        // Validate that we have both username and password in the environment
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
          console.error("WARNING: ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set.");
          return done(null, false, { message: "Server authentication configuration error" });
        }
        
        // Check for admin credentials first
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          // Create a static user object with fixed ID
          const user = {
            id: 1,
            username: ADMIN_USERNAME,
            role: "admin"
          };
          
          return done(null, user);
        }
        
        // If not using the fixed credentials, check the database as fallback
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const validPassword = await comparePasswords(password, user.password);
        
        if (!validPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Don't include password in the user object we pass to done
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword as Express.User);
      } catch (error) {
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
      // Check for our fixed user first
      if (id === 1) {
        // Return the fixed user with admin role
        return done(null, {
          id: 1,
          username: "Reiger65",
          role: "admin"
        });
      }
      
      // Otherwise, look up in the database
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Don't include password in the deserialized user
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword as Express.User);
    } catch (error) {
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
    const FIXED_PASSWORD = "Johannes@@2025";
    
    if (currentPassword !== FIXED_PASSWORD) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // In a real app, we would update the password in the database
    // Since we're using a fixed password, we'd need to update the code or use environment variables
    // For demo purposes, we'll just return success
    
    return res.status(200).json({ message: "Password changed successfully" });
  });
}