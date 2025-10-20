import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

// Create password hash for "hello"
const helloHash = await hashPassword('hello');
console.log(`Password hash for 'hello': ${helloHash}`);

// Create password hash for "admin" 
const adminHash = await hashPassword('admin');
console.log(`Password hash for 'admin': ${adminHash}`);