# InboxForge AIO - All-in-One Docker Container
# Conduit + Outlook Bridge + Hono API + React PWA + s6-overlay

FROM alpine:3.19 AS builder

# Install build dependencies
RUN apk add --no-cache \
    nodejs npm \
    cargo rust \
    git \
    build-base \
    openssl-dev \
    sqlite-dev

# Build Conduit (pinned version)
WORKDIR /build/conduit
RUN git clone --depth 1 --branch v0.7.0 https://gitlab.com/famedly/conduit.git . && \
    cargo build --release && \
    strip target/release/conduit

# Copy and build Node applications
WORKDIR /build/apps

# Bridge Outlook
COPY apps/bridge-outlook/package*.json ./bridge-outlook/
WORKDIR /build/apps/bridge-outlook
RUN npm ci --only=production

# API
COPY apps/api/package*.json /build/apps/api/
WORKDIR /build/apps/api
RUN npm ci --only=production

# Web PWA
COPY apps/web/package*.json /build/apps/web/
WORKDIR /build/apps/web
RUN npm ci

COPY apps/web /build/apps/web
RUN npm run build

# ============================================================================
# Final image
# ============================================================================
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache \
    nodejs npm \
    nginx \
    curl \
    ca-certificates \
    tzdata \
    tini

# Install s6-overlay
ARG S6_OVERLAY_VERSION=3.1.6.2
ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz /tmp
ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-x86_64.tar.xz /tmp
RUN tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz && \
    tar -C / -Jxpf /tmp/s6-overlay-x86_64.tar.xz && \
    rm -f /tmp/*.tar.xz

# Copy Conduit binary
COPY --from=builder /build/conduit/target/release/conduit /usr/local/bin/conduit

# Copy Node applications
COPY --from=builder /build/apps/bridge-outlook/node_modules /app/bridge-outlook/node_modules
COPY apps/bridge-outlook /app/bridge-outlook

COPY --from=builder /build/apps/api/node_modules /app/api/node_modules
COPY apps/api /app/api

# Copy built PWA
COPY --from=builder /build/apps/web/dist /var/www/html

# Copy configurations
COPY config/conduit/conduit.toml /etc/conduit/conduit.toml
COPY config/nginx/nginx.conf /etc/nginx/nginx.conf
COPY config/s6-overlay/s6-rc.d /etc/s6-overlay/s6-rc.d

# Create data directories
RUN mkdir -p \
    /data/conduit \
    /data/appservices \
    /data/bridges \
    /data/matrix-state && \
    chmod 755 /data

# Expose ports
EXPOSE 8080 6167

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Use s6-overlay as init
ENTRYPOINT ["/init"]

