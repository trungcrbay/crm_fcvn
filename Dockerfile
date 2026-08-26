
FROM node:20-alpine AS base

# Cài đặt build tools cần thiết cho native modules (như bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM base AS development

WORKDIR /app

COPY . .

ENV NODE_ENV=development
EXPOSE 3000

CMD ["npm", "run", "start:dev"]

FROM base AS build

WORKDIR /app

COPY . .

RUN npm run build

RUN npm prune --omit=dev

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

USER node

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
