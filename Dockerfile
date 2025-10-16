# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 4000

# Optional: health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
	CMD wget --spider -q http://localhost:4000/health || exit 1

CMD ["node", "dist/src/app.js"]
