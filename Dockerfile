FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Create volume for node_modules
VOLUME ["/app/node_modules"]

# Copy package files and install dependencies
COPY --chown=appuser:appgroup package*.json ./
RUN pnpm install

# Copy source code
COPY --chown=appuser:appgroup . .

# Expose port
EXPOSE 8080

# Start application in development mode
CMD ["pnpm", "run", "dev"] 