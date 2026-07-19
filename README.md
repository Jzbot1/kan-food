# 🍔 Shipbite SaaS Platform — Cloudflare & Domain Setup Guide

Complete guide for configuring **Cloudflare DNS**, **Vercel Frontend**, **AWS Backend**, and **Neon PostgreSQL Database** under the custom domain **`shipbite.in`**.

---

## 🌐 Complete System Architecture

```
                               ┌─────────────────────────────────────────┐
                               │            Cloudflare DNS               │
                               │             (shipbite.in)               │
                               └────────────────────┬────────────────────┘
                                                    │
                      ┌─────────────────────────────┴─────────────────────────────┐
                      │                                                           │
                      ▼                                                           ▼
         ┌─────────────────────────┐                                 ┌─────────────────────────┐
         │     Vercel Frontend     │                                 │     AWS EC2 Backend     │
         │   https://shipbite.in   │                                 │ https://api.shipbite.in │
         │ https://www.shipbite.in │                                 │     (16.16.146.222)     │
         └────────────┬────────────┘                                 └────────────┬────────────┘
                      │                                                           │
                      └───────────────────────────┬───────────────────────────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────┐
                                     │   Neon PostgreSQL DB    │
                                     │   (Serverless Cloud)    │
                                     └─────────────────────────┘
```

---

## 📍 STEP 1: Cloudflare DNS Records Setup

Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ Select `shipbite.in` ➔ Go to **DNS** ➔ **Records**.

Add these **3 exact DNS records**:

| Type | Name / Host | Target / Content | Proxy Status | Purpose |
|---|---|---|---|---|
| **A** | `@` | `76.76.21.21` | 🟠 **Proxied** | Points `shipbite.in` to Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | 🟠 **Proxied** | Points `www.shipbite.in` to Vercel |
| **A** | `api` | `16.16.146.222` | 🟠 **Proxied** | Points `api.shipbite.in` to AWS EC2 |

---

## 🔒 STEP 2: Cloudflare SSL/TLS Security Settings

In Cloudflare left navigation menu:

1. **SSL/TLS ➔ Overview**:
   - Select **Full** (or **Full (strict)**) encryption mode.
2. **SSL/TLS ➔ Edge Certificates**:
   - Enable **Always Use HTTPS** ➔ `ON`
   - Enable **Automatic HTTPS Rewrites** ➔ `ON`
   - Set **Minimum TLS Version** ➔ `TLS 1.2`

---

## 🚀 STEP 3: Vercel Frontend Configuration (`shipbite.in`)

### 1. Vercel Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

### 2. Vercel Environment Variables
Add these keys in Vercel **Settings ➔ Environment Variables**:

```env
VITE_API_URL=https://api.shipbite.in
VITE_JZ_CASH_TOKEN=509ffd178aff24dc09640796da90fc22
VITE_JZ_CASH_CREATE_URL=https://cash.free.jzstore.in/api/create-order
VITE_JZ_CASH_STATUS_URL=https://cash.free.jzstore.in/api/check-order-status
```

### 3. Vercel Custom Domain Attachment
Go to Vercel **Settings ➔ Domains**:
- Add `shipbite.in`
- Add `www.shipbite.in`

---

## ⚡ STEP 4: AWS EC2 Backend Configuration (`api.shipbite.in`)

### 1. Server Environment Setup
SSH into your AWS EC2 instance:
```bash
ssh -i "your-key.pem" ubuntu@16.16.146.222
```

Navigate to backend directory and check `.env`:
```bash
cd ~/kan-food/backend
cat .env
```
Ensure `.env` contains:
```env
DATABASE_URL="postgresql://neondb_owner:npg_9CBmWV2azxry@ep-empty-rain-augesl69.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="shipbite_prod_secret_key_87a92b3c1d4e5f6g7h8i9j0k_secure"
PORT=4000
CLIENT_ORIGIN="https://shipbite.in"
```

### 2. NGINX Reverse Proxy Configuration
Check `/etc/nginx/sites-available/default`:
```bash
sudo cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name api.shipbite.in 16.16.146.222 _;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo systemctl restart nginx
```

### 3. PM2 Process Manager
```bash
cd ~/kan-food/backend
npm run build
pm2 restart all || pm2 start dist/index.js --name "shipbite-backend"
pm2 save
```

### 4. Issue Certbot SSL Certificate
```bash
sudo certbot --nginx -d api.shipbite.in
```

---

## ✅ STEP 5: Verification & Testing

### 1. Test Backend API Health
Open terminal or browser:
```bash
curl https://api.shipbite.in/health
```
**Expected Output:**
```json
{"status":"ok","timestamp":"2026-07-19T12:00:00.000Z","service":"Shipbite API"}
```

### 2. Test Frontend
Open in browser:
- 👉 `https://shipbite.in`
- 👉 `https://www.shipbite.in`

---

## 🛠️ Troubleshooting & Commands Quick Reference

| Issue | Solution / Command |
|---|---|
| **Backend port 4000 conflict** | `sudo fuser -k 4000/tcp && pm2 restart all` |
| **Check PM2 process status** | `pm2 status` |
| **View PM2 live logs** | `pm2 logs` |
| **Restart NGINX server** | `sudo systemctl restart nginx` |
| **Check NGINX configuration syntax** | `sudo nginx -t` |
| **Check AWS Port 80/443 firewall** | AWS EC2 Console ➔ Security Groups ➔ Edit Inbound Rules (Allow HTTP/80 & HTTPS/443) |
