FROM node:18-alpine AS builder

# Set environment variables
ENV NODE_ENV=production

WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set working directory to frontend app
WORKDIR /app/apps/frontend

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system app && \
    adduser --system --ingroup app app && \
    mkdir -p /app && \
    chown -R app:app /app

WORKDIR /app

# Copy only the built application from the builder stage
COPY --from=builder --chown=app:app /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=app:app /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder --chown=app:app /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder --chown=app:app /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=app:app /app/apps/frontend/postcss.config.js ./apps/frontend/
COPY --from=builder --chown=app:app /app/apps/frontend/tailwind.config.ts ./apps/frontend/

# Install only production dependencies
WORKDIR /app
RUN npm ci --only=production

# Set working directory to frontend app
WORKDIR /app/apps/frontend

# Use non-root user
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application in production mode
CMD ["npm", "run", "start"] 