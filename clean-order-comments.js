/**
 * Script om ALLE berichten te verwijderen uit de 'notes' velden van orders
 * 
 * Dit script doorzoekt alle orders en maakt het notes veld leeg
 * zodat er geen automatische berichten of rode puntjes meer zichtbaar zijn.
 */

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function cleanOrderComments() {
  try {
    console.log('🧹 Starten met het opschonen van ALLE berichten in order notes...');

    // Haal alle orders op die een notes veld hebben dat niet null of leeg is
    const orders = await db.execute(sql.raw(`
      SELECT id, order_number, notes 
      FROM orders 
      WHERE notes IS NOT NULL AND notes != ''
    `));

    console.log(`Found ${orders.rows.length} orders with notes content`);

    // Update alle orders om het notes veld leeg te maken
    const result = await db.execute(sql.raw(`
      UPDATE orders
      SET notes = ''
      WHERE notes IS NOT NULL AND notes != ''
    `));

    const updatedCount = result.rowCount || 0;
    console.log(`\n🎉 Opschonen voltooid! ${updatedCount} orders zijn leeggemaakt.`);
  } catch (error) {
    console.error('❌ Fout bij het opschonen van order notes:', error);
  } finally {
    // Sluit de database verbinding
    process.exit(0);
  }
}

// Start het opschonen
cleanOrderComments();