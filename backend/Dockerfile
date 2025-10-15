FROM node:20-alpine

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Default command (will be overridden by docker-compose)
CMD ["npm", "run", "dev"]
