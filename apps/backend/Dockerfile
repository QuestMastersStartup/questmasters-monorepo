# Stage 1: Build
FROM oven/bun:1.2-alpine AS build
WORKDIR /app

# Copy root metadata
COPY package.json bun.lock ./

# Copy shared packages
COPY packages packages

# Copy backend app
COPY apps/backend apps/backend

# Install dependencies
RUN bun install

# Build the backend
WORKDIR /app/apps/backend
RUN bun run build

# Stage 2: Runtime
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app/apps/backend

# Copy the bundled output and package.json
# Note: dist contains the data/ folder which was copied during build
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./package.json

EXPOSE 3000
ENV NODE_ENV=production

# Start the application
CMD ["bun", "run", "start:prod"]
