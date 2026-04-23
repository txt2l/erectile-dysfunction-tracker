FROM node:22-bookworm-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm ci --legacy-peer-deps

# Copy entire project
COPY . .

# Build the application
RUN npm run build

# Debug: Verify client build exists
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "Contents of dist/:" && \
    ls -la dist/ && \
    echo "" && \
    echo "Contents of dist/client/:" && \
    ls -la dist/client/ || echo "NO CLIENT BUILD" && \
    echo "" && \
    echo "Checking for index.html:" && \
    test -f dist/client/index.html && echo "✓ index.html found" || echo "✗ index.html MISSING" && \
    echo "" && \
    echo "Contents of dist/client/assets/:" && \
    ls -la dist/client/assets/ || echo "NO ASSETS"

EXPOSE 3000

# Start server using tsx (available via devDependencies installed by npm ci)
CMD ["sh", "-c", "echo 'Starting ChatroomLM...'; echo 'PORT='$PORT; echo 'NODE_ENV='$NODE_ENV; echo ''; echo 'Dist contents:'; ls -la dist/client/ || echo 'MISSING CLIENT BUILD'; echo ''; npx tsx server/index.ts"]
