# syntax=docker/dockerfile:1
# Multi-target build: `api` (NestJS) and `web` (static React app behind nginx).

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate
WORKDIR /app

FROM base AS build
# Install with only manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/e2e/package.json apps/e2e/
COPY packages/game/package.json packages/game/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile
COPY . .
# The web talks to the API through nginx on the same origin (/api, /socket.io).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm turbo run build --filter=@mystery-game/api --filter=@mystery-game/web

FROM base AS api
ENV NODE_ENV=production PORT=3000
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
