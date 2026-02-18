FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

COPY turbo.json package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY . .

RUN pnpm install

WORKDIR /app/apps/api

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/main.js"]
