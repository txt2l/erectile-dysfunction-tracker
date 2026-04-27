FROM node:22-bookworm-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies including tw-animate-css
RUN npm install --legacy-peer-deps &&     npm install tw-animate-css --legacy-peer-deps

# Copy entire project
COPY . .

# Build client (vite -> dist/client) AND server (tsup -> dist/)
RUN npm run build

# Prune dev dependencies to keep image lean
# We use --omit=dev to keep only production dependencies
RUN npm prune --omit=dev --legacy-peer-deps

# Verify both builds exist
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "-- Client build (dist/client):" && \
    ls -la dist/client/ || echo "NO CLIENT BUILD" && \
    test -f dist/client/index.html && echo "index.html found" || echo "index.html MISSING" && \
    echo "-- Server build (dist/):" && \
    ls dist/*.js 2>/dev/null || echo "NO SERVER JS FILES"

EXPOSE 3000

ENV NODE_ENV=production

# Run the compiled server bundle directly with node (fast, no transpilation)
# Ensure we use the bundled server
CMD ["node", "dist/server.js"]
