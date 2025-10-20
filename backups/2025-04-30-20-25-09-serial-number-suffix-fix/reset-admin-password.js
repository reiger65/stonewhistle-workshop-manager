/**
 * Eenvoudige script om admin wachtwoord te resetten in .env file
 */
import { readFileSync, writeFileSync } from 'fs';

// Nieuwe gebruikersnaam en wachtwoord instellen
const newUsername = process.argv[2] || 'admin';
const newPassword = process.argv[3] || 'admin';

if (process.argv.length < 4) {
  console.log('\x1b[33mWaarschuwing: Geen gebruikersnaam of wachtwoord opgegeven.\x1b[0m');
  console.log('Standaard waarden worden gebruikt: admin / admin');
  console.log('Gebruik: node reset-admin-password.js [gebruikersnaam] [wachtwoord]');
}

console.log(`\x1b[36mAdmin inloggegevens instellen op: ${newUsername} / ${newPassword}\x1b[0m`);

// Update de .env bestand
try {
  // Lees de huidige inhoud van .env
  let envContent = '';
  try {
    envContent = readFileSync('.env', 'utf8');
  } catch (err) {
    console.log('\x1b[33m.env bestand niet gevonden, nieuw bestand wordt aangemaakt.\x1b[0m');
  }

  // Vervang of voeg de admin gegevens toe
  const lines = envContent.split('\n');
  const newLines = [];
  let usernameFound = false;
  let passwordFound = false;

  for (const line of lines) {
    if (line.startsWith('ADMIN_USERNAME=')) {
      newLines.push(`ADMIN_USERNAME=${newUsername}`);
      usernameFound = true;
    } else if (line.startsWith('ADMIN_PASSWORD=')) {
      newLines.push(`ADMIN_PASSWORD=${newPassword}`);
      passwordFound = true;
    } else {
      newLines.push(line);
    }
  }

  // Voeg variabelen toe als ze niet bestaan
  if (!usernameFound) {
    newLines.push(`ADMIN_USERNAME=${newUsername}`);
  }
  if (!passwordFound) {
    newLines.push(`ADMIN_PASSWORD=${newPassword}`);
  }

  // Schrijf de aangepaste inhoud naar .env
  writeFileSync('.env', newLines.join('\n'));
  console.log('\x1b[32m.env bestand bijgewerkt met nieuwe inloggegevens.\x1b[0m');
  console.log('\x1b[32mWachtwoord reset succesvol!\x1b[0m');
  console.log('\x1b[36mU kunt nu inloggen met: ' + newUsername + ' / ' + newPassword + '\x1b[0m');
  console.log('\x1b[36mStart de applicatie met: npm run dev\x1b[0m');
} catch (error) {
  console.error('\x1b[31mFout bij het bijwerken van inloggegevens:\x1b[0m', error);
  process.exit(1);
}