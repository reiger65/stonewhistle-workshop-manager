#!/bin/bash
# VPS Deployment Script for Ubuntu/Debian

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Create database
sudo -u postgres createdb stonewhistle_workshop

# Create user (replace with your credentials)
sudo -u postgres psql -c "CREATE USER workshop_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE stonewhistle_workshop TO workshop_user;"

# Clone and setup your app
git clone <your-repo-url> /opt/stonewhistle-workshop
cd /opt/stonewhistle-workshop

# Install dependencies
npm install

# Set environment variables
echo "DATABASE_URL=postgresql://workshop_user:your_password@localhost:5432/stonewhistle_workshop" > .env
echo "NODE_ENV=production" >> .env
echo "PORT=3000" >> .env

# Build and start
npm run build
npx prisma migrate deploy
pm2 start dist/index.js --name "stonewhistle-workshop"
pm2 save
pm2 startup

# Setup Nginx (optional)
sudo apt install nginx -y
# Configure Nginx reverse proxy to port 3000
