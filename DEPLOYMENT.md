# Deployment Guide

## Production Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

**Requirements:**
- VPS with 2GB+ RAM
- Docker and Docker Compose installed
- Domain name with DNS configured

**Steps:**

1. **Clone repository on server:**
```bash
git clone https://github.com/yourusername/message-agent.git
cd message-agent
```

2. **Configure environment:**
```bash
cp .env.example .env
nano .env
```

Update these for production:
```env
MATRIX_SERVER_NAME=your-domain.com
REGISTRATION_TOKEN=generate-random-secure-token
OPENAI_API_KEY=your-key
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-secret
GRAPH_REDIRECT_URI=https://your-domain.com/oauth/callback
```

3. **Build and start:**
```bash
docker-compose up -d
```

4. **Setup SSL with Caddy or nginx:**

Create `Caddyfile`:
```
your-domain.com {
    reverse_proxy localhost:8080
}
```

5. **Configure Azure redirect URI:**
- Update to `https://your-domain.com/oauth/callback`

---

### Option 2: Sliplane (One-Click Deploy)

Sliplane is optimized for this setup. See `SLIPLANE_RESET_GUIDE.md` for details.

**Quick Deploy:**

1. **Push to GitHub:**
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/message-agent.git
git push -u origin main
```

2. **Connect to Sliplane:**
- Create new service
- Connect GitHub repository
- Select Dockerfile deployment
- Configure environment variables

3. **Set environment variables in Sliplane:**
- Add all variables from `.env.example`
- Configure volumes for `/data`

---

### Option 3: Kubernetes

**Requirements:**
- Kubernetes cluster
- kubectl configured
- Persistent volume support

**Create deployment:**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inboxforge
spec:
  replicas: 1
  selector:
    matchLabels:
      app: inboxforge
  template:
    metadata:
      labels:
        app: inboxforge
    spec:
      containers:
      - name: inboxforge
        image: your-registry/inboxforge:latest
        ports:
        - containerPort: 8080
        volumeMounts:
        - name: data
          mountPath: /data
        env:
        - name: MATRIX_SERVER_NAME
          valueFrom:
            configMapKeyRef:
              name: inboxforge-config
              key: server_name
        # Add other env vars from Secret
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: inboxforge-data
---
apiVersion: v1
kind: Service
metadata:
  name: inboxforge
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: inboxforge
```

**Deploy:**
```bash
kubectl apply -f k8s/
```

---

### Option 4: Railway / Render / Fly.io

These platforms support Dockerfile deployments:

**Railway:**
```bash
railway login
railway init
railway up
```

**Render:**
- Connect GitHub repository
- Select "Docker" as environment
- Add environment variables
- Add persistent disk at `/data`

**Fly.io:**
```bash
fly launch
fly secrets set OPENAI_API_KEY=your-key
fly deploy
```

---

## Environment Variables Reference

### Required
```env
MATRIX_SERVER_NAME=your-domain.com
REGISTRATION_TOKEN=random-secure-token
OPENAI_API_KEY=sk-...
GRAPH_CLIENT_ID=azure-client-id
GRAPH_CLIENT_SECRET=azure-secret
```

### Optional
```env
OPENAI_MODEL=gpt-4-turbo-preview
GRAPH_TENANT_ID=common
GRAPH_REDIRECT_URI=https://your-domain.com/oauth/callback
```

### Generated (after registration)
```env
MATRIX_BOT_TOKEN=...
AS_TOKEN_OUTLOOK=...
HS_TOKEN_OUTLOOK=...
```

---

## Post-Deployment Checklist

- [ ] Container/service is running
- [ ] Health check returns 200 at `/health`
- [ ] Domain is accessible via HTTPS
- [ ] Matrix registration works
- [ ] Outlook OAuth flow completes
- [ ] AI suggestions are working
- [ ] Logs show no errors
- [ ] Backups configured for `/data`

---

## Monitoring

### Health Checks

```bash
# Container health
curl https://your-domain.com/health

# API health
curl https://your-domain.com/api/health

# Matrix federation
curl https://your-domain.com/.well-known/matrix/server
```

### Logs

```bash
# Docker Compose
docker-compose logs -f

# Kubernetes
kubectl logs -f deployment/inboxforge

# Individual services
docker-compose logs api
docker-compose logs conduit
```

---

## Backup Strategy

### Critical Data

The `/data` directory contains:
- `conduit/` - Matrix database
- `appservices/` - Bridge registrations
- `bridges/` - Bridge state
- `matrix-state/` - E2EE keys

### Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/inboxforge"

# Stop services
docker-compose stop

# Backup data
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" data/

# Restart services
docker-compose start

# Keep only last 7 backups
find "$BACKUP_DIR" -name "data_*.tar.gz" -mtime +7 -delete
```

### Restore

```bash
# Stop services
docker-compose down

# Restore data
tar -xzf backup.tar.gz

# Start services
docker-compose up -d
```

---

## Scaling Considerations

### Single Container Limitations

The AIO (All-In-One) design is optimized for:
- Single user or small team
- Up to ~100 rooms
- Moderate message volume

### Scaling Out

For larger deployments, separate components:

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  conduit:
    image: matrixdotorg/conduit:latest
    # ...
  
  api:
    build: ./apps/api
    replicas: 3
    # ...
  
  bridge:
    build: ./apps/bridge-outlook
    # ...
  
  web:
    build: ./apps/web
    # ...
  
  nginx:
    image: nginx:alpine
    # Load balance to api replicas
```

---

## Security Hardening

### Firewall Rules

```bash
# UFW example
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 6167/tcp  # Block direct Conduit access
ufw enable
```

### Nginx Security Headers

Already configured in `config/nginx/nginx.conf`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Rate Limiting

Configured in nginx:
- API: 10 req/s
- Matrix: 30 req/s

### SSL/TLS

Use Caddy or certbot for automatic HTTPS:

```bash
# Certbot
certbot --nginx -d your-domain.com
```

---

## Updating

### Docker Compose

```bash
git pull
docker-compose build
docker-compose up -d
```

### Kubernetes

```bash
docker build -t your-registry/inboxforge:v2 .
docker push your-registry/inboxforge:v2
kubectl set image deployment/inboxforge inboxforge=your-registry/inboxforge:v2
```

---

## Cost Estimation

**Monthly costs (approximate):**

- VPS (2GB RAM): $5-10
- Domain: $10-15/year
- OpenAI API: $5-50 (depends on usage)
- Total: ~$15-60/month

**Free tier options:**
- Fly.io: Free allowance for small apps
- Railway: $5 credit/month
- Render: Free tier available (with limits)

---

## Support

For deployment issues:
1. Check logs first
2. Review environment variables
3. Verify external services (Azure, OpenAI)
4. Open GitHub issue with logs

