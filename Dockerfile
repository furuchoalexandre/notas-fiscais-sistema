FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy patches directory (required for pnpm patched dependencies)
COPY patches/ ./patches/

# Install dependencies (no frozen lockfile to handle patches correctly)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Expose port (Railway uses PORT env var)
EXPOSE $PORT

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
