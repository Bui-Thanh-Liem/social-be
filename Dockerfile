# ============================================
# STAGE 1: Build TypeScript
# ============================================
FROM node:20-alpine AS builder

# Install FFmpeg để build/testing nếu cần
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (bao gồm devDependencies)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript → dist/
RUN npm run build && rm -rf node_modules

# ============================================
# STAGE 2: Production Dependencies
# ============================================
FROM node:20-alpine AS prod-dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --only=production && \
    npm cache clean --force

# ============================================
# STAGE 3: Final Production Image
# ============================================
FROM node:20-alpine

# Install dumb-init + FFmpeg (production cần FFmpeg để worker chạy)
RUN apk add --no-cache dumb-init ffmpeg

# Tạo non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 👉 Tạo thư mục logs và cấp quyền cho user nodejs
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Copy production node_modules từ stage 2
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built code từ builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy package.json (cần để chạy npm start:prod)
COPY --chown=nodejs:nodejs package*.json ./

# Switch sang non-root user
USER nodejs

# Expose port
EXPOSE 9000

# Environment variables
ENV NODE_ENV=production \
    PORT=9000

# Health check
HEALTHCHECK --interval=60s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start production (server + worker)
CMD ["npm", "run", "start:prod"]
