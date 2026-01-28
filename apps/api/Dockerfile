FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
COPY apps/api ./apps/api
RUN pnpm -C apps/api build

# Production
FROM node:20-alpine

RUN npm install -g pnpm@8

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

RUN pnpm install --prod --frozen-lockfile

COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/prisma ./apps/api/prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main"]
