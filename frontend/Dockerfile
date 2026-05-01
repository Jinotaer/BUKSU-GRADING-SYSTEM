# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Base path on the server (e.g. /jino_taer)
# Passed in from docker-compose via build arg
ARG VITE_BASE_PATH=/jino_taer

COPY package*.json ./
RUN npm ci

COPY . .

# 1. Replace every hardcoded "http://localhost:5000" in source + env files.
#    This turns absolute dev URLs (e.g. "http://localhost:5000/api/auth/login")
#    into subpath-relative URLs (e.g. "/jino_taer/api/auth/login") so all API
#    calls route through the Nginx proxy inside this container.
RUN find src -type f \( -name "*.js" -o -name "*.jsx" \) \
      -exec sed -i "s|http://localhost:5000|${VITE_BASE_PATH}|g" {} \; && \
    sed -i "s|http://localhost:5000|${VITE_BASE_PATH}|g" .env      2>/dev/null || true && \
    sed -i "s|http://localhost:5000|${VITE_BASE_PATH}|g" .env.local 2>/dev/null || true

# 2. Expose as a VITE_ env var so BrowserRouter can read it at build time
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# 3. Build with the correct asset base URL (trailing slash required by Vite)
RUN npx vite build --base=${VITE_BASE_PATH}/

# ── Production stage ────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
