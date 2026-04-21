FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache caddy

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY assets/Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000 # Node
EXPOSE 80   # Caddy
CMD caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
