import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from '../db/connection.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Local strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user[0].password_hash);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      return done(null, user[0]);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    if (user.length === 0) {
      return done(null, false);
    }
    
    return done(null, user[0]);
  } catch (error) {
    return done(error);
  }
});
