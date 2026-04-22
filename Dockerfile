FROM node:22-bookworm-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "echo 'PORT=$PORT'; ls -la dist/; node dist/server.js"]
