import fs from 'fs';

// Read the PostgreSQL dump
const postgresDump = fs.readFileSync('/Users/hanshoukes/Downloads/ui_exact_visuals/stonewhistle-db-backup-2025-10-20T15-10-56-034Z.sql', 'utf8');

// Convert PostgreSQL syntax to SQLite
let sqliteDump = postgresDump
  // Remove PostgreSQL-specific settings and comments
  .replace(/--.*$/gm, '')
  .replace(/SET [^;]+;/g, '')
  .replace(/SELECT pg_catalog\.set_config[^;]+;/g, '')
  
  // Remove schema references
  .replace(/public\./g, '')
  
  // Remove owner assignments
  .replace(/ALTER TABLE [^;]+ OWNER TO [^;]+;/g, '')
  
  // Remove sequence operations
  .replace(/CREATE SEQUENCE [^;]+;/g, '')
  .replace(/ALTER SEQUENCE [^;]+;/g, '')
  .replace(/ALTER SEQUENCE [^;]+ OWNED BY [^;]+;/g, '')
  
  // Remove comments
  .replace(/COMMENT ON [^;]+;/g, '')
  
  // Remove ALTER TABLE operations that are not supported in SQLite
  .replace(/ALTER TABLE ONLY [^;]+ ALTER COLUMN [^;]+;/g, '')
  .replace(/ALTER TABLE ONLY [^;]+ ADD CONSTRAINT [^;]+;/g, '')
  .replace(/ALTER DEFAULT PRIVILEGES [^;]+;/g, '')
  
  // Remove sequence value operations
  .replace(/SELECT pg_catalog\.setval[^;]+;/g, '')
  
  // Remove indexes with USING clauses
  .replace(/CREATE INDEX [^;]+ USING [^;]+;/g, '')
  
  // Convert data types
  .replace(/integer NOT NULL/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
  .replace(/integer/g, 'INTEGER')
  .replace(/text/g, 'TEXT')
  .replace(/character varying/g, 'TEXT')
  .replace(/timestamp without time zone/g, 'DATETIME')
  .replace(/timestamp\([0-9]+\) without time zone/g, 'DATETIME')
  .replace(/boolean/g, 'BOOLEAN')
  .replace(/jsonb/g, 'TEXT')
  .replace(/json/g, 'TEXT')
  
  // Convert functions
  .replace(/now\(\)/g, "CURRENT_TIMESTAMP")
  .replace(/nextval\('[^']+'\)/g, 'NULL')
  
  // Remove DEFAULT constraints that use sequences
  .replace(/DEFAULT nextval\('[^']+'\)/g, '')
  
  // Fix PostgreSQL cast syntax
  .replace(/::[A-Za-z]+/g, '')
  
  // Remove COPY statements and data (we'll handle data separately)
  .replace(/COPY [^;]+;/g, '')
  .replace(/^[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+\t[^\t\n]+$/gm, '')
  .replace(/^\\.$/gm, '')
  
  // Clean up multiple newlines and empty lines
  .replace(/\n\s*\n\s*\n/g, '\n\n')
  .replace(/^\s*\n+/, '')
  .replace(/\n\s*$/g, '\n');

// Write the converted SQLite dump
fs.writeFileSync('database-backup-sqlite-v2.sql', sqliteDump);

console.log('✅ Converted PostgreSQL dump to SQLite format (v2)');
console.log('📁 Output: database-backup-sqlite-v2.sql');


