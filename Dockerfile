#syntax=docker/dockerfile:1.3

##########################################
# 全域變數
##########################################
ARG NODE_VERSION=20.5.1

FROM node:${NODE_VERSION}-slim
ARG PNPM_DIR
ENV PNPM_HOME=${PNPM_DIR} \
    # 設定 PRISMA Engine 需要的 binary 路徑資料夾
    # 這是為了解決 Prisma Engine 在生產環境下無法從外部下載 binary 的問題
    # Arvin Yang - 2024/04/08
    PRISMA_SCHEMA_ENGINE_BINARY=/app/prisma

WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt,id=apt_cache,sharing=locked \
    set -xe; \
    apt-get update; \
    apt-get install -y openssl

RUN --mount=type=cache,target=/usr/local/cache/.pnpm-store,id=pnpm_store,sharing=locked \
    set -xe; \
    npm install -g pnpm;

# 因為依賴包可能會變動，所以獨立執行
RUN --mount=type=cache,target=/usr/local/cache/.pnpm-store,id=pnpm_store,sharing=locked \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    set -xe; \
    pnpm install;

COPY . .

RUN --mount=type=cache,target=/usr/local/cache/.pnpm-store,id=pnpm_store,sharing=locked \
    set -xe; \
    pnpm run prisma-generate; \
    pnpm run build; 

EXPOSE 3000

# CMD ["node", ".output/server/index.mjs"]
CMD [ "tail", "-f", "/dev/null"]
