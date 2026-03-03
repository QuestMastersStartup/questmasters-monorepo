# Stage 1: Build
FROM oven/bun:1.2-alpine AS build
WORKDIR /app

# Copy root metadata
COPY package.json bun.lock ./

# Copy shared packages
COPY packages packages

# Copy api app
COPY apps/api apps/api

# Install dependencies
RUN bun install

# Build the API
WORKDIR /app/apps/api
RUN bun run build

# Stage 2: Runtime
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app/apps/api

# Copy the bundled output, data and package.json
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json

EXPOSE 3000
ENV NODE_ENV=production

# Start the application
CMD ["bun", "run", "start:prod"]
