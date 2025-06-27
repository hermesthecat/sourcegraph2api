# Multi-stage build for Sourcegraph2API
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sourcegraph -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy environment example (optional)
COPY env.example ./

# Change ownership to nodejs user
RUN chown -R sourcegraph:nodejs /app
USER sourcegraph

# Expose port
EXPOSE 7033

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').request('http://localhost:7033/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).end()"

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"] 