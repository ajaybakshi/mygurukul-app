# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sanskrit-collector -u 1001

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R sanskrit-collector:nodejs /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Set proper permissions
RUN chown -R sanskrit-collector:nodejs /app

# Switch to non-root user
USER sanskrit-collector

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV LOG_LEVEL=info

# Start the application
CMD ["node", "server.js"]
