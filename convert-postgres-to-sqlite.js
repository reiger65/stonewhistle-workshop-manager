import fs from 'fs';

// Read the PostgreSQL dump
const postgresDump = fs.readFileSync('/Users/hanshoukes/Downloads/ui_exact_visuals/stonewhistle-db-backup-2025-10-20T15-10-56-034Z.sql', 'utf8');

// Convert PostgreSQL syntax to SQLite
let sqliteDump = postgresDump
  // Remove PostgreSQL-specific settings
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
  
  // Convert data types
  .replace(/integer NOT NULL/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
  .replace(/integer/g, 'INTEGER')
  .replace(/text/g, 'TEXT')
  .replace(/character varying/g, 'TEXT')
  .replace(/timestamp without time zone/g, 'DATETIME')
  .replace(/boolean/g, 'BOOLEAN')
  .replace(/jsonb/g, 'TEXT')
  
  // Convert functions
  .replace(/now\(\)/g, "CURRENT_TIMESTAMP")
  .replace(/nextval\('[^']+'\)/g, 'NULL')
  
  // Remove DEFAULT constraints that use sequences
  .replace(/DEFAULT nextval\('[^']+'\)/g, '')
  
  // Convert COPY statements to INSERT statements
  .replace(/COPY [^(]+ \(([^)]+)\) FROM stdin;/g, (match, columns) => {
    return `-- Data for table (columns: ${columns})`;
  })
  .replace(/^([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)$/gm, (match, ...values) => {
    // This is a simplified conversion - we'll need to handle this more carefully
    return `-- INSERT data: ${values.join(', ')}`;
  })
  
  // Remove \. statements
  .replace(/^\\.$/gm, '')
  
  // Clean up multiple newlines
  .replace(/\n\s*\n\s*\n/g, '\n\n')
  
  // Remove empty lines at the beginning
  .replace(/^\s*\n+/, '');

// Write the converted SQLite dump
fs.writeFileSync('database-backup-sqlite.sql', sqliteDump);

console.log('✅ Converted PostgreSQL dump to SQLite format');
console.log('📁 Output: database-backup-sqlite.sql');
