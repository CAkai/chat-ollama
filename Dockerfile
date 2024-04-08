ARG NODE_VERSION=20.12.2

FROM node:${NODE_VERSION}-slim
# 設定 PRISMA Engine 需要的 binary 路徑資料夾
# 這是為了解決 Prisma Engine 在生產環境下無法從外部下載 binary 的問題
# Arvin Yang - 2024/04/08
ENV PRISMA_SCHEMA_ENGINE_BINARY=/app/prisma


RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# DATABASE_URL environment variable takes precedence over .env file configuration
ENV DATABASE_URL=file:/app/sqlite/chatollama.sqlite

COPY pnpm-lock.yaml package.json ./
RUN npm install -g pnpm
RUN pnpm i

COPY . .

RUN pnpm run prisma-generate
RUN pnpm run build

EXPOSE 3000

CMD [ "tail", "-f", "/dev/null"]
