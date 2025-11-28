# ETS Events - Docker Deployment Guide

## Overview

This application is deployed using Docker Swarm on the same node as your Nginx Proxy Manager (HawkerTre). Authentication is handled by NPM's Access Lists feature - **no auth configuration needed in the app container**.

## Prerequisites

- Docker Swarm initialized
- Nginx Proxy Manager running (your existing setup)
- `.env` file with `VITE_MAPBOX_TOKEN`

## Quick Start

### 1. Deploy the Application

**PowerShell (Windows):**
```powershell
.\deploy.ps1
```

**Bash (Linux/WSL):**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Manual Deployment:**
```bash
# Build image
docker build --build-arg VITE_MAPBOX_TOKEN=your_token -t ets-events:latest .

# Deploy stack
docker stack deploy -c docker-compose.ets-events.yml ets
```

### 2. Configure Nginx Proxy Manager

1. **Open NPM Dashboard**: http://your-server:81
2. **Create Access List** (one-time setup):
   - Go to **Access Lists**
   - Click **Add Access List**
   - Name: "ETS Events Access"
   - **Authorization** tab:
     - Username: `your-username`
     - Password: `your-password`
     - Click **Add** for each user
   - **Save**

3. **Add Proxy Host**:
   - Go to **Hosts** → **Proxy Hosts**
   - Click **Add Proxy Host**
   - **Details** tab:
     - Domain Names: `ets.yourdomain.com` (or your domain)
     - Scheme: `http`
     - Forward Hostname: `ets_ets-events` (Docker service name)
     - Forward Port: `80`
     - Cache Assets: ✅ (optional)
     - Block Common Exploits: ✅
     - Websockets Support: ❌ (not needed)
   - **SSL** tab:
     - SSL Certificate: Request new with Let's Encrypt
     - Force SSL: ✅
     - Email: your-email@domain.com
   - **Advanced** tab (leave empty - no custom config needed)
   - **Access List** dropdown:
     - Select "ETS Events Access"
   - **Save**

4. **Done!** Visit https://ets.yourdomain.com
   - Browser will prompt for username/password
   - Credentials managed in NPM Access List

## Service Management

### View Service Status
```bash
docker service ps ets_ets-events
```

### View Logs
```bash
docker service logs -f ets_ets-events
```

### Update Application
After making code changes:

```bash
# Rebuild and update
docker build --build-arg VITE_MAPBOX_TOKEN=your_token -t ets-events:latest .
docker service update --force ets_ets-events
```

Or use the deployment script:
```powershell
.\deploy.ps1
```

### Scale Service (optional)
```bash
docker service scale ets_ets-events=2
```

### Remove Service
```bash
docker stack rm ets
```

## User Management

### Add User
1. Open NPM Dashboard
2. Go to **Access Lists** → "ETS Events Access"
3. Click **Edit**
4. **Authorization** tab → Add username/password
5. **Save**
6. Users take effect immediately (no container restart needed)

### Remove User
1. Same as above, but click the **trash icon** next to the user
2. **Save**

### Change Password
1. Remove old user entry
2. Add new entry with same username but new password
3. **Save**

## Architecture

```
Internet
   ↓
NPM (ports 80/443) - Handles SSL + Auth
   ↓
ets_ets-events service (internal port 80)
   ↓
React SPA with Mapbox
```

**Key Points:**
- App container has **no auth** - it's just the React app + Nginx
- NPM handles **all authentication** via Access Lists (persistent in NPM's database)
- When you update the app container, **auth settings are untouched**
- NPM's Access Lists are stored in the external volume `Trinity-NPM-Data`

## Troubleshooting

### Service won't start
```bash
# Check service status
docker service ps ets_ets-events --no-trunc

# View detailed logs
docker service logs ets_ets-events --tail 100
```

### Can't access via NPM
1. Verify service is running: `docker service ls | grep ets`
2. Check service name in NPM matches: `ets_ets-events`
3. Ensure both NPM and app are on `npm-proxy` network
4. Check NPM logs: `docker logs <npm-container-id>`

### Health check failing
```bash
# Test from within the container
docker exec $(docker ps -q -f name=ets_ets-events) wget -qO- http://localhost/health
```

### Need to rebuild without cache
```bash
docker build --no-cache --build-arg VITE_MAPBOX_TOKEN=your_token -t ets-events:latest .
```

### Auth not working
1. Verify Access List is attached to Proxy Host in NPM
2. Check NPM logs for auth errors
3. Try different browser (clear cache)
4. Verify username/password in NPM Access List

## Updating Mapbox Token

If you need to change the Mapbox token:

1. Update `.env` file with new token
2. Rebuild and redeploy:
   ```bash
   .\deploy.ps1
   ```

## Performance

- **Image Size**: ~50MB (multi-stage build)
- **Memory Usage**: ~10-20MB per container
- **CPU Usage**: Minimal (static files only)
- **Startup Time**: ~5 seconds

## Security

- ✅ Authentication handled by NPM (outside app container)
- ✅ HTTPS enforced via NPM + Let's Encrypt
- ✅ Security headers in nginx.conf
- ✅ No sensitive data in container
- ✅ Health checks for monitoring
- ✅ Automatic container restart on failure

## Backup

**What to backup:**
- `.env` file (Mapbox token)
- NPM Access Lists (automatic via `Trinity-NPM-Data` volume)
- NPM SSL certificates (automatic via `Trinity-NPM-SSL` volume)

**No app data to backup** - it's a stateless visualization tool.

## Support

For issues:
1. Check service logs
2. Verify NPM configuration
3. Test health endpoint: `curl http://ets_ets-events/health`
4. Check browser console for frontend errors
