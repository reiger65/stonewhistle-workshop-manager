#!/bin/bash

echo "🧪 Setting up Stonewhistle Workshop Manager for testing..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install main dependencies
npm install

# Install client dependencies
if [ -d "client" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

echo "🔧 Creating environment file..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://localhost:5432/stonewhistle_workshop"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Session
SESSION_SECRET="your-super-secret-session-key-$(date +%s)"

# Optional: Shopify integration
SHOPIFY_API_KEY=""
SHOPIFY_API_SECRET=""
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo "🗄️ Checking database setup..."

# Check if PostgreSQL is running
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw stonewhistle_workshop; then
        echo "✅ Database 'stonewhistle_workshop' exists"
    else
        echo "⚠️  Database 'stonewhistle_workshop' not found"
        echo "   Create it with: createdb stonewhistle_workshop"
        echo "   Or import your backup with: pg_restore -d stonewhistle_workshop /path/to/stonewhistle_backup.sql"
    fi
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql"
fi

echo "🔍 Running quick tests..."

# Test if TypeScript compiles
echo "📝 Testing TypeScript compilation..."
if npm run check 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️  TypeScript compilation issues (this is normal for first run)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your database (see TESTING.md for details)"
echo "2. Start the backend: npm run dev"
echo "3. Start the frontend: cd client && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "📖 For detailed testing instructions, see TESTING.md"
echo "🚀 For deployment instructions, see DEPLOYMENT.md"
