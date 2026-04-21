FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json .
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache caddy
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY assets/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
CMD caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
