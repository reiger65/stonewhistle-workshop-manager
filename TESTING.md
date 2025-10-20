# 🧪 Testing Your Stonewhistle Workshop Manager

## 🚀 **Quick Start Testing**

### **Step 1: Install Dependencies**
```bash
# Install all dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### **Step 2: Set Up Environment**
Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stonewhistle_workshop"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Session
SESSION_SECRET="your-super-secret-session-key"

# Optional: Shopify integration
SHOPIFY_API_KEY=""
SHOPIFY_API_SECRET=""
```

### **Step 3: Set Up Database**
```bash
# Option A: Use your existing database backup
# Import your PostgreSQL backup:
pg_restore -d stonewhistle_workshop /path/to/stonewhistle_backup.sql

# Option B: Create fresh database
# Create database:
createdb stonewhistle_workshop

# Run migrations:
npm run db:push
```

### **Step 4: Start Development Servers**

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 🔍 **Testing Checklist**

### **✅ Backend API Testing**

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Test Orders API:**
```bash
# Get all orders
curl http://localhost:3000/api/orders

# Create new order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "TEST-001",
    "customer_name": "Test Customer",
    "customer_email": "test@example.com",
    "status": "pending"
  }'
```

**Test Authentication:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

### **✅ Frontend Testing**

1. **Open browser:** http://localhost:5173
2. **Check if React app loads**
3. **Test navigation between pages**
4. **Test offline functionality** (disconnect internet)
5. **Test PWA features** (install as app)

### **✅ Database Testing**

**Check database connection:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"
```

**Verify tables exist:**
```bash
psql $DATABASE_URL -c "\dt"
```

## 🐛 **Common Issues & Solutions**

### **Issue: Database Connection Failed**
```bash
# Check if PostgreSQL is running
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Check connection string
echo $DATABASE_URL
```

### **Issue: Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### **Issue: Frontend Build Errors**
```bash
# Clear cache and reinstall
rm -rf client/node_modules
cd client && npm install
```

### **Issue: Missing Dependencies**
```bash
# Install missing packages
npm install bcrypt @types/bcrypt cors @types/cors
```

## 🎯 **Production Testing**

### **Build Test:**
```bash
# Build everything
npm run build

# Test production build
npm start
```

### **Docker Test:**
```bash
# Build Docker image
docker build -t stonewhistle-workshop .

# Run container
docker run -p 3000:3000 stonewhistle-workshop
```

## 📊 **Performance Testing**

### **Load Testing:**
```bash
# Install artillery (load testing)
npm install -g artillery

# Create test script
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "API Test"
    requests:
      - get:
          url: "/api/health"
      - get:
          url: "/api/orders"
EOF

# Run load test
artillery run load-test.yml
```

## 🔧 **Debugging Tools**

### **Database Debugging:**
```bash
# Connect to database
psql $DATABASE_URL

# Check table structure
\d orders
\d order_items

# View data
SELECT * FROM orders LIMIT 5;
```

### **Server Debugging:**
```bash
# Run with debug logs
DEBUG=* npm run dev

# Check logs
tail -f logs/app.log  # if logging to file
```

### **Frontend Debugging:**
```bash
# Open browser dev tools
# Check Network tab for API calls
# Check Console for errors
# Check Application tab for IndexedDB
```

## ✅ **Success Criteria**

Your app is working correctly if:

1. **✅ Backend starts** without errors
2. **✅ Frontend loads** at http://localhost:5173
3. **✅ Database connects** successfully
4. **✅ API endpoints respond** (test with curl)
5. **✅ Authentication works** (login/logout)
6. **✅ Offline mode works** (disconnect internet)
7. **✅ PWA installs** as app
8. **✅ All pages load** without errors

## 🚀 **Ready for Deployment?**

Once all tests pass:
1. **Build production version:** `npm run build`
2. **Test production build:** `npm start`
3. **Follow DEPLOYMENT.md** for hosting setup

Your app is ready to deploy! 🎉
