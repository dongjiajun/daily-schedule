# 须以仓库根目录为 build context 构建（pnpm monorepo 需访问 @daily-schedule/shared）
FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@11.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY frontend/package.json ./frontend/package.json
COPY apps/miniprogram/package.json ./apps/miniprogram/package.json
RUN pnpm install --frozen-lockfile --filter frontend...

COPY packages/shared ./packages/shared
COPY frontend ./frontend
RUN pnpm --filter @daily-schedule/shared run build && pnpm --filter frontend run build

FROM nginx:alpine
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
