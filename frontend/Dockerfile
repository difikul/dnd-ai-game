FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Default command (will be overridden by docker-compose)
CMD ["npm", "run", "dev"]
