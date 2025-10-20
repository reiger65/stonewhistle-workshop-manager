# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install PostgreSQL client for database operations
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application (both client and server)
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
