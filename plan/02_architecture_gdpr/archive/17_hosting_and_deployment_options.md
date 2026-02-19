# Hosting & Deployment Options for CalorieTracker

**Date:** 2026-02-15
**Purpose:** Practical analysis of hosting/deployment paths for single developer
**Stack:** Next.js 16 + Supabase (PostgreSQL) + Resend

---

## Executive Summary

For CalorieTracker, the **recommended path is Vercel for production** with local development for testing. This aligns with the Next.js + Supabase stack, provides excellent EU support, and has minimal operational complexity for a single developer.

**Quick Decision Guide:**

| Stage | Recommended Option | Why |
|-------|-------------------|-----|
| **Local Dev** | Local Next.js dev server + Local Supabase (Docker) | Fast iteration, free |
| **Staging** | Vercel Preview Deployments | Git branch-based, free, PR testing |
| **Production MVP** | Vercel Pro (EU) + Supabase Pro (EU) | < €20/mo, minimal ops |
| **Production Growth** | Vercel Pro + Supabase Pro or Scale | Scales linearly, predictable costs |

**Not recommended for MVP:**
- ❌ Hetzner/VPS: Too much operational overhead (DevOps, security patching, SSL, monitoring)
- ❌ Self-hosted Supabase: Complex, time-consuming maintenance
- ❌ Multi-cloud setups: Over-engineering for single developer

---

## 1. Local-Only Dev/Testing Path

### What It Looks Like

**Development Stack (Local):**

```bash
# Frontend: Next.js dev server
npm run dev                    # Runs on localhost:3000

# Backend: Supabase (via Docker)
supabase start                 # Runs Supabase locally (Postgres, Auth, Storage, etc.)

# Email: Mailpit (SMTP testing container)
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```

**Environment Setup:**

```bash
# .env.local (dev only)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=local_dev_service_role_key
RESEND_API_KEY=mock_for_dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### What Works Well

✅ **Instant feedback:** Hot reload, no deployment wait times
✅ **Free:** Zero cost for development
✅ **Privacy:** No data leaves your machine
✅ **Offline work:** Can develop without internet
✅ **Full feature parity:** Supabase local has most features of cloud

### Hard Limits

❌ **No external testing:** Can't share with friends on other devices
❌ **No mobile testing:** Can't test on phone (different network)
❌ **No OAuth:** Google/Apple/Microsoft OAuth won't work locally
❌ **No email delivery:** Mailpit only shows emails in browser (doesn't send)
❌ **No production-like environment:** Latency, error handling, etc. differ
❌ **Data isolation:** Data doesn't sync between team members (if you ever add collaborators)

### When Local Is Sufficient

- **Early development:** Building core features, UI, database schema
- **Unit/integration testing:** Running automated tests
- **Debugging:** Isolating issues without cloud noise
- **Privacy-sensitive work:** Prototyping with fake data

### When You Need Cloud (Even for Testing)

- **User acceptance testing:** Real users trying the app
- **OAuth testing:** Google/Apple/Microsoft sign-in flows
- **Email testing:** Real email delivery (not just local preview)
- **Performance testing:** Real network latency, edge cases
- **Mobile testing:** Testing on actual phones/tablets

### Local-Only Testing Checklist

If you want to stay local as long as possible:

```markdown
✅ Database schema works (migrations, RLS)
✅ Authentication flows work (email/password)
✅ Core features work (food logging, stats)
✅ UI looks good on desktop
✅ Error handling works (404s, 500s)
✅ GDPR endpoints work (export, delete)
```

**Then move to cloud for:**
- OAuth flows
- Real email delivery
- Mobile testing
- User testing with friends/family

### Supabase Local (Docker) - What's Included

When you run `supabase start`, you get:

| Service | What It Does | Limitations vs Cloud |
|---------|--------------|---------------------|
| **PostgreSQL** | Database | Full feature parity |
| **Gotrue (Auth)** | Authentication | OAuth providers won't callback to localhost |
| **Storage** | File storage | Full feature parity |
| **Realtime** | Websockets/subscriptions | Full feature parity |
| **Studio** | Admin dashboard | Full feature parity |
| **Functions** | Edge functions | Basic support (no logs/analytics) |

**Key Difference:** OAuth providers (Google, Apple, Microsoft) require a live URL with HTTPS. You can test them with tools like ngrok, but it's extra setup.

### Cost: Free (Local Only)

- Next.js dev server: Free
- Supabase local (Docker): Free (uses local resources)
- Mailpit (email testing): Free (Docker container)
- Total: €0/month

---

## 2. Vercel Path (Recommended for Production)

### What It Looks Like

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Next.js App  │  │ API Routes   │  │ Edge Functions│   │
│  │ (SSR/ISR)    │  │ (Serverless) │  │ (Low latency) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         ↓                  ↓                  ↓           │
│    ┌────────────────────────────────────────────────┐   │
│    │              Global Edge Network               │   │
│    │  (Frankfurt, Dublin, Amsterdam, etc.)          │   │
│    └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTPS (secure)
┌─────────────────────────────────────────────────────────┐
│                 Supabase (Backend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ PostgreSQL   │  │ Auth         │  │ Storage      │   │
│  │ (EU Region)  │  │ (Gotrue)     │  │ (S3-compatible)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓ SMTP
┌─────────────────────────────────────────────────────────┐
│                      Resend (Email)                      │
│                   (EU Region Available)                  │
└─────────────────────────────────────────────────────────┘
```

### Pros

#### Developer Experience

✅ **Git-based deployments:** Push to git branch → auto-deploy to preview
✅ **Preview deployments:** Every PR gets a live URL for testing
✅ **Rollbacks:** One-click rollback to previous deployment
✅ **Environment variables:** Per-environment (production, preview, development)
✅ **Logs & analytics:** Built-in, no setup required
✅ **Zero-config SSL:** HTTPS automatically handled
✅ **Next.js native:** Built by the Next.js team, zero friction

#### Performance

✅ **Edge network:** 35+ global edge locations, fast worldwide
✅ **ISR/SSR support:** Server-side rendering out of the box
✅ **Image optimization:** Automatic image optimization (WebP, AVIF)
✅ **Smart caching:** CDN caching with cache invalidation

#### EU & Compliance

✅ **EU regions available:** Frankfurt (fra1), Dublin (dub1), Amsterdam (ams1)
✅ **GDPR-compliant:** EU data processing, EU-US Data Privacy Framework certified
✅ **SOC 2 Type II:** Security certification available
✅ **Subprocessor DPA:** Available on request

#### Cost

✅ **Hobby free tier:** Good for side projects
✅ **Predictable pricing:** No hidden fees
✅ **Pay-as-you-go:** Scale with usage

### Cons

❌ **Vendor lock-in:** Vercel-specific features (Edge Functions, Analytics) are hard to migrate
❌ **Cold starts:** Serverless functions have cold starts (~100-500ms)
❌ **Execution time limits:** 10-60 seconds per function (Hobby: 10s, Pro: 60s)
❌ **Timeout limits:** API routes timeout after configured duration
❌ **No persistent storage:** Can't write to filesystem (must use Supabase Storage)
❌ **Limited background jobs:** Cron jobs have restrictions

### EU-Specific Considerations

#### Data Residency

**Vercel Regions (EU):**

| Region | Code | Location | Latency (from Switzerland) |
|--------|------|----------|---------------------------|
| Frankfurt | fra1 | Germany | ~20ms |
| Dublin | dub1 | Ireland | ~30ms |
| Amsterdam | ams1 | Netherlands | ~25ms |

**Configuration (next.config.mjs):**

```javascript
// next.config.mjs
export const preferredRegion = ['fra1', 'dub1'];

// This tells Vercel to prioritize EU regions for your app
```

**Verification:**

```bash
# Check which region your app is running in
curl -I https://your-app.vercel.app

# Look for: x-vercel-id: fra1-xxxxx...
```

**Supabase Regions (EU):**

| Region | Code | Location |
|--------|------|----------|
| Frankfurt | eu-central-1 | Germany |
| Dublin | eu-west-1 | Ireland |

**Create Supabase Project in EU:**

```bash
# When creating project, select region:
supabase projects create --name calorietracker --db-url postgresql://...

# Or via Supabase Dashboard: Create Project → Select "eu-central-1"
```

#### Cross-Border Transfers

Even with EU regions, there may be cross-border data flows:

- **Vercel Analytics:** May process data in US for analytics (check current terms)
- **Supabase Auth:** OAuth providers (Google, Apple, Microsoft) involve international flows
- **Food APIs:** Nutritionix, USDA, Open Food Facts may be US-hosted

**Mitigation:**
- Use Vercel EU regions for compute
- Use Supabase EU region for database
- Document cross-border flows in privacy policy
- Choose EU-hosted food APIs where possible (e.g., Open Food Facts)

### Cost Breakdown

#### Vercel Pricing (2026)

| Plan | Price | Included | Overages |
|------|-------|----------|----------|
| **Hobby** | Free | 100GB bandwidth, 6,000 min execution | Not available |
| **Pro** | $20/mo | 1TB bandwidth, 10,000 GB-hrs execution | $40/100GB, $0.60/GB-hr |
| **Enterprise** | Custom | Unlimited, SSO, support | Contact sales |

**Hobby (Free) - Good for MVP testing:**

- 100GB bandwidth/month (~50,000 page views for simple app)
- 6,000 minutes execution/month (~100 hours)
- Unlimited deployments
- Preview deployments
- Basic analytics

**Pro ($20/mo) - Recommended for launch:**

- 1TB bandwidth/month (~500,000 page views)
- 10,000 GB-hrs execution/month (~1,670 hours)
- No execution time limit per function (vs 10s on Hobby)
- Faster builds
- Team collaboration features
- Priority support

#### Combined Stack Cost

| Stage | Vercel | Supabase | Resend | Total |
|-------|--------|----------|--------|-------|
| **Free Tier** | Free | Free | Free | €0 |
| **MVP Launch** | $20/mo | $25/mo | Free* | ~€40/mo |
| **Growth (5k users)** | $20/mo | $25/mo | $20/mo | ~€65/mo |
| **Scale (50k users)** | $20/mo | $50/mo | $20/mo | ~€90/mo |

*Resend free tier: 3,000 emails/month (sufficient for most MVPs)

#### When to Upgrade

**Vercel Hobby → Pro:**
- More than 100GB bandwidth/month
- Need >10s execution time per function
- Want team collaboration
- Want faster builds

**Supabase Free → Pro:**
- More than 500MB database storage
- More than 2GB file storage
- More than 50,000 MAU (Monthly Active Users)
- Need daily backups

**Resend Free → Pro:**
- More than 3,000 emails/month
- Need custom domain for emails

### Operational Complexity

#### Setup (One-time, ~1 hour)

1. **Vercel Setup:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link project
   vercel link

   # Set environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # ... (repeat for all env vars)
   ```

2. **Supabase Setup:**
   - Create account
   - Create project (select EU region)
   - Get credentials
   - Set up auth providers (Google, Apple, Microsoft)

3. **Resend Setup:**
   - Create account
   - Add domain (or use resend.dev domain for free tier)
   - Get API key

4. **Git Integration:**
   - Connect GitHub repository to Vercel
   - Configure build settings (if needed)
   - Enable preview deployments

#### Daily Operations (< 5 minutes)

- [ ] Check Vercel dashboard for errors
- [ ] Check Supabase dashboard for usage
- [ ] Review logs if errors occurred

#### Weekly Operations (~30 minutes)

- [ ] Review error trends
- [ ] Check usage limits (approaching free tier?)
- [ ] Update dependencies (security patches)

#### Monthly Operations (~1 hour)

- [ ] Review costs
- [ ] Test GDPR endpoints (export, delete)
- [ ] Check backup status (Supabase)
- [ ] Review security events

### Deployment Workflow

```
┌────────────────────────────────────────────────────────────┐
│ 1. Local Development                                       │
│    - npm run dev (Next.js)                                 │
│    - supabase start (Local Supabase)                        │
│    - Write code, test locally                               │
└────────────────────────────────────────────────────────────┘
                         ↓ git push
┌────────────────────────────────────────────────────────────┐
│ 2. Preview Deployment (Automatic)                         │
│    - Push to feature branch (e.g., feature/add-oauth)       │
│    - Vercel creates preview URL: https://...-vercel.app    │
│    - Test on preview URL                                   │
└────────────────────────────────────────────────────────────┘
                         ↓ PR merge
┌────────────────────────────────────────────────────────────┐
│ 3. Production Deployment (Automatic)                       │
│    - Merge to main branch                                   │
│    - Vercel auto-deploys to production                     │
│    - One-click rollback if issues                           │
└────────────────────────────────────────────────────────────┘
```

**No manual steps needed!** Just push code and Vercel handles the rest.

### CI/CD

**Vercel handles CI/CD automatically:**

```yaml
# No need for GitHub Actions! Vercel provides:
✅ Automatic builds on push
✅ Preview deployments for PRs
✅ Production deployments on main branch merge
✅ Environment variable management
✅ Cache management
```

**If you need custom CI (e.g., run tests before deploy):**

```javascript
// vercel.json (optional)
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "dev": false  // Disable auto-deploy for dev branch
    }
  },
  "build": {
    "env": {
      "RUN_TESTS": "true"
    }
  }
}
```

### Logs & Monitoring

**Vercel Logs (Built-in):**

- Real-time logs for each deployment
- Filter by status code, path, duration
- Download logs for analysis
- Retention: 7 days (Hobby), 30 days (Pro)

**Vercel Analytics (Built-in):**

- Page views, unique visitors
- Web Vitals (CLS, FID, LCP)
- Geographic distribution
- Free tier available

**Supabase Dashboard:**

- Database queries, slow queries
- Auth events (sign-ups, sign-ins)
- Storage usage
- Real-time subscriptions

**Error Tracking (Vercel + Custom):**

```typescript
// Example: Custom error logging to Supabase
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

async function logError(error: Error, context: any) {
  const supabase = createRouteHandlerClient({ cookies })

  await supabase.from('security_events').insert({
    event_type: 'error',
    severity: 'error',
    message: error.message,
    stack_trace: error.stack,
    metadata: context
  })
}
```

### Secrets Management

**Environment Variables (Vercel):**

```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter value when prompted

# Via Dashboard
# Vercel Dashboard → Project → Settings → Environment Variables
```

**Best Practices:**

- ✅ Never commit secrets to git
- ✅ Use different values for preview/production
- ✅ Prefix public variables with `NEXT_PUBLIC_`
- ✅ Rotate secrets periodically (especially if leaked)
- ✅ Use Vercel's "secret" protection (hidden in logs)

---

## 3. Non-Vercel Alternatives

### Comparison Matrix

| Provider | Pros | Cons | Cost (MVP) | EU Support | Complexity |
|----------|------|------|-------------|------------|------------|
| **Vercel** | Best Next.js DX, preview deployments, edge network | Vendor lock-in, cold starts | €20/mo | ✅ Excellent | Low |
| **Cloudflare** | Fastest edge, Workers for compute | Limited Next.js support, fewer integrations | €5/mo | ✅ Excellent | Low |
| **Fly.io** | Multi-region, close to Vercel DX | Smaller ecosystem, less mature | €5-10/mo | ✅ Good | Medium |
| **Render** | Simple, good DB hosting | Slower builds, fewer features | €7/mo | ✅ Limited | Low |
| **Hetzner/VPS** | Full control, cheap | High ops overhead, security patching | €5/mo | ✅ Full | High |

### Cloudflare

#### What It Looks Like

```
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare Pages                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Next.js App  │  │ Edge Runtime │  │ Workers      │   │
│  │ (Static/SSR) │  │ (V8 isolates)│  │ (Serverless) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         ↓                  ↓                  ↓           │
│    ┌────────────────────────────────────────────────┐   │
│    │              Global Edge Network (300+ cities) │   │
│    └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
              (Still need Supabase for database)
```

#### Pros

✅ **Fastest edge:** 300+ locations, <50ms latency worldwide
✅ **Workers:** Fast serverless functions (no cold starts)
✅ **D1 database:** Edge SQL database (Postgres-compatible)
✅ **Pages:** Free hosting for static sites
✅ **Great EU presence:** Data centers in all EU countries
✅ **WAF included:** Built-in security, DDoS protection
✅ **Cheap:** Free tier generous, low-cost paid plans

#### Cons

❌ **Limited Next.js support:** SSR requires Workers (more complex)
❌ **Smaller ecosystem:** Fewer integrations, less documentation
❌ **Learning curve:** Different mental model than Vercel
❌ **Migration from Vercel:** Requires code changes
❌ **Analytics:** Less mature than Vercel Analytics
❌ **Preview deployments:** Less polished than Vercel

#### Cost

| Plan | Price | Included |
|------|-------|----------|
| **Free** | Free | 500 builds/month, 100GB bandwidth |
| **Pro** | $20/mo | Unlimited builds, 1TB bandwidth |

**Workers (for API routes):**

| Plan | Price | Included |
|------|-------|----------|
| **Free** | Free | 100,000 requests/day |
| **Paid** | $5/mo | 10 million requests/mo |

**D1 Database (alternative to Supabase):**

| Plan | Price | Included |
|------|-------|----------|
| **Free** | Free | 5GB storage, 5M rows/day |
| **Paid** | $0.15/GB | Per GB storage |

#### When to Choose Cloudflare

- ✅ You need extreme global performance (users worldwide)
- ✅ You want to use D1 database (edge SQL)
- ✅ You're comfortable with Workers (not Next.js-centric)
- ✅ Cost is critical (Cloudflare is cheaper)

#### When to Avoid

- ❌ You want the best Next.js DX (Vercel is better)
- ✅ You want preview deployments like Vercel
- ❌ You want minimal operational complexity

### Fly.io

#### What It Looks Like

```
┌─────────────────────────────────────────────────────────┐
│                    Fly.io Apps                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Next.js App  │  │ Node.js Apps │  │ PostgreSQL   │   │
│  │ (Docker)     │  │ (Docker)     │  │ (Managed)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         ↓                  ↓                  ↓           │
│    ┌────────────────────────────────────────────────┐   │
│    │           Global Anycast Network              │   │
│    └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Pros

✅ **Multi-region:** Deploy to multiple regions, auto-failover
✅ **Docker-native:** Run any containerized app
✅ **PostgreSQL managed:** Built-in database hosting
✅ **Close to Vercel DX:** Git-based deployments, preview apps
✅ **Good EU support:** Frankfurt, London, Amsterdam regions
✅ **Cheaper than Vercel:** $5-10/mo for comparable setup

#### Cons

❌ **Smaller ecosystem:** Fewer integrations, less documentation
❌ **Less mature:** Newer platform, more bugs/rough edges
❌ **Limited analytics:** Basic monitoring, less detailed than Vercel
❌ **Builds slower:** Longer build times than Vercel
❌ **Migration from Vercel:** Requires code changes (not drop-in)

#### Cost

| Resource | Price |
|----------|-------|
| **Apps** | Free tier + $5-10/mo |
| **PostgreSQL** | $5/mo (1GB), $20/mo (8GB) |
| **Bandwidth** | 1GB free, $0.02/GB after |
| **Total MVP** | ~€10-15/mo |

#### When to Choose Fly.io

- ✅ You want multi-region deployment (e.g., EU + US)
- ✅ You want managed PostgreSQL (instead of Supabase)
- ✅ You're comfortable with Docker
- ✅ Cost is critical

#### When to Avoid

- ❌ You want the best Next.js DX
- ❌ You want minimal operational complexity
- ❌ You rely on Vercel-specific features (Analytics, Edge Functions)

### Render

#### What It Looks Like

```
┌─────────────────────────────────────────────────────────┐
│                      Render                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Web Services │  │ PostgreSQL   │  │ Redis        │   │
│  │ (Next.js)    │  │ (Managed)    │  │ (Cached)     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Pros

✅ **Simple:** Easy to set up, good docs
✅ **Managed PostgreSQL:** Built-in, no Supabase needed
✅ **Good free tier:** 750 hours/month for web services
✅ **SSL included:** Automatic HTTPS
✅ **Git-based:** Push to deploy, like Vercel
✅ **EU region:** Frankfurt available

#### Cons

❌ **Slower builds:** Longer build times than Vercel
❌ **No preview deployments:** Only production/staging
❌ **Less Next.js optimization:** No ISR/SSR optimizations
❌ **Limited analytics:** Basic monitoring
❌ **No edge network:** Only Frankfurt region (in EU)

#### Cost

| Resource | Price |
|----------|-------|
| **Web Service** | Free (750h) + $7/mo |
| **PostgreSQL** | Free (90 days) + $7/mo |
| **Total MVP** | ~€14/mo |

#### When to Choose Render

- ✅ You want simple, straightforward hosting
- ✅ You want managed PostgreSQL
- ✅ You don't need preview deployments
- ✅ You're okay with Frankfurt-only EU region

#### When to Avoid

- ❌ You need preview deployments
- ❌ You need edge performance
- ❌ You want the best Next.js DX

### Hetzner/VPS

#### What It Looks Like

```
┌─────────────────────────────────────────────────────────┐
│                  Hetzner VPS (CX22)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Nginx        │  │ Next.js (PM2)│  │ PostgreSQL   │   │
│  │ (Reverse Proxy)│ (Node.js)   │  │ (Self-hosted) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Pros

✅ **Full control:** Configure everything yourself
✅ **Cheap:** €4-6/mo for decent VPS
✅ **EU native:** German company, EU data centers
✅ **No vendor lock-in:** Can migrate anywhere
✅ **Predictable:** Fixed monthly cost

#### Cons

❌ **High operational overhead:**
  - Security patching (OS, PostgreSQL, Node.js)
  - SSL certificate management (Let's Encrypt)
  - Monitoring setup (Prometheus, Grafana)
  - Log management (ELK stack or similar)
  - Backup management
  - Failover/redundancy
  - DDoS protection
❌ **No preview deployments:** Manual setup required
❌ **No auto-scaling:** Manual scaling required
❌ **No built-in CI/CD:** Need GitHub Actions or similar
❌ **Single point of failure:** VPS goes down, app goes down

#### Cost

| Component | Price |
|-----------|-------|
| **VPS (CX22)** | €4.79/mo |
| **PostgreSQL** | Included (self-hosted) |
| **SSL** | Free (Let's Encrypt) |
| **Monitoring** | Free (Prometheus) or $10/mo (Grafana Cloud) |
| **Total** | ~€5-15/mo |

#### Operational Complexity (High)

**Setup (2-4 days):**

1. **Provision VPS:**
   ```bash
   # Create Hetzner account
   # Order VPS (CX22: 2 vCPU, 4GB RAM, 40GB SSD)
   # Choose region: Frankfurt (fsn1)
   ```

2. **Configure OS:**
   ```bash
   # SSH into server
   ssh root@your-server-ip

   # Update system
   apt update && apt upgrade -y

   # Install dependencies
   apt install -y nginx postgresql nodejs npm certbot

   # Create non-root user
   adduser deploy
   usermod -aG sudo deploy
   ```

3. **Configure PostgreSQL:**
   ```bash
   # Secure PostgreSQL
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE calorietracker;
   CREATE USER calorietracker WITH ENCRYPTED PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE calorietracker TO calorietracker;
   ```

4. **Configure Nginx (reverse proxy):**
   ```nginx
   # /etc/nginx/sites-available/calorietracker
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Configure SSL:**
   ```bash
   # Request SSL certificate
   certbot --nginx -d your-domain.com
   ```

6. **Configure PM2 (process manager):**
   ```bash
   # Install PM2
   npm install -g pm2

   # Start Next.js app
   pm2 start npm --name "calorietracker" -- start

   # Configure auto-restart
   pm2 startup
   pm2 save
   ```

7. **Set up CI/CD (GitHub Actions):**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Deploy to server
           run: |
             ssh deploy@your-server-ip "cd /var/www/calorietracker && git pull && npm install && npm run build && pm2 restart calorietracker"
   ```

**Daily Operations (15-30 minutes):**

- [ ] Check server logs (`journalctl -u nginx`, `pm2 logs`)
- [ ] Monitor disk usage (`df -h`)
- [ ] Check PostgreSQL status (`systemctl status postgresql`)

**Weekly Operations (1-2 hours):**

- [ ] Security updates (`apt upgrade`)
- [ ] Review logs for errors
- [ ] Check backup status
- [ ] Monitor SSL certificate expiration

**Monthly Operations (2-4 hours):**

- [ ] Full security audit (check for vulnerabilities)
- [ ] Review performance metrics
- [ ] Test backup restoration
- [ ] Update Node.js, PostgreSQL versions

#### When to Choose Hetzner/VPS

- ✅ You have DevOps experience
- ✅ You want full control and no vendor lock-in
- ✅ Cost is critical and you have time to spare
- ✅ You're building a complex app that needs custom infrastructure

#### When to Avoid

- ❌ You're a solo developer with limited time
- ❌ You want to focus on features, not operations
- ❌ You don't have DevOps experience
- ❌ You want minimal operational complexity

### Summary of Alternatives

| Use Case | Recommended |
|----------|-------------|
| **Best for Next.js** | Vercel (top choice) |
| **Cheapest with good UX** | Fly.io |
| **Fastest edge** | Cloudflare |
| **Simple with DB** | Render |
| **Full control** | Hetzner/VPS (if you have DevOps experience) |

**For CalorieTracker:** Stick with **Vercel + Supabase**. It's the best balance of:
- Developer experience
- Operational complexity (low)
- Cost (reasonable)
- EU support
- Next.js optimization

---

## 4. Data Residency / EU Routing Implications (High Level)

### What Is Data Residency?

**Data residency** means keeping data within a specific geographic region (e.g., EU). This is important for:

- **GDPR compliance:** EU personal data should ideally stay in EU
- **Data sovereignty:** Laws about where data can be stored
- **Performance:** Faster latency for EU users
- **Legal requirements:** Some countries require data to stay within borders

### High-Level Data Flow

```
User Device (Switzerland)
         ↓ HTTPS request
Vercel Edge (Frankfurt, Germany) ← Compute
         ↓ HTTPS
Supabase (Frankfurt, Germany) ← Database
         ↓ SMTP
Resend (EU region available) ← Email
         ↓ HTTPS API
Food APIs (may be US-hosted) ← External data
```

### Key Components & Their Locations

| Component | Recommended Location | Current EU Support |
|-----------|---------------------|-------------------|
| **Frontend (Vercel)** | Frankfurt (fra1) | ✅ Excellent |
| **Backend (Supabase)** | Frankfurt (eu-central-1) | ✅ Excellent |
| **Email (Resend)** | EU region available | ✅ Good |
| **Food APIs** | Depends on provider | ⚠️ Variable |

### Vercel EU Routing

**How it works:**

1. **DNS resolution:** User requests `your-app.vercel.app`
2. **Edge routing:** Vercel's anycast DNS routes to nearest edge location
3. **Function execution:** Serverless functions run in preferred region

**Configuration:**

```javascript
// next.config.mjs
export const preferredRegion = ['fra1', 'dub1'];

// This tells Vercel to prioritize Frankfurt/Dublin for serverless functions
```

**Verification:**

```bash
# Check region from response headers
curl -I https://your-app.vercel.app

# Look for: x-vercel-id: fra1-xxxxx... (Frankfurt)
# or: x-vercel-id: dub1-xxxxx... (Dublin)
```

**What this means:**
- ✅ Compute runs in EU (Frankfurt/Dublin)
- ✅ Static assets cached globally (fast everywhere)
- ✅ API requests processed in EU
- ⚠️ Vercel Analytics may process data in US (check terms)

### Supabase EU Routing

**How it works:**

1. **Region selection:** Choose EU region when creating project
2. **Database location:** All data stored in that region
3. **Auth flows:** Auth happens in that region
4. **Storage:** Files stored in that region

**Configuration:**

```bash
# Create Supabase project in EU
supabase projects create \
  --name calorietracker \
  --db-url postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres \
  --region eu-central-1  # Frankfurt

# Or via Dashboard: Create Project → Select "eu-central-1"
```

**Verification:**

```bash
# Check Supabase project region
supabase projects list

# Or check database connection string:
# db.xxx.supabase.co → xxx indicates region (e.g., eu-west-1)
```

**What this means:**
- ✅ Database stored in EU (Frankfurt)
- ✅ Auth tokens issued in EU
- ✅ Storage files in EU
- ✅ No cross-border data transfer for core data
- ⚠️ OAuth providers (Google, Apple, Microsoft) involve international flows

### Resend EU Routing

**How it works:**

1. **Region selection:** Choose EU region when creating account
2. **Email delivery:** Emails sent from EU servers
3. **API requests:** Processed in EU

**Configuration:**

```bash
# Resend automatically routes to nearest region
# No explicit configuration needed for EU
# Check Resend Dashboard for current region
```

**What this means:**
- ✅ Email sent from EU servers (if EU region available)
- ✅ Email templates stored in EU
- ✅ Email logs in EU
- ⚠️ Email may still pass through international networks (email routing)

### Cross-Border Data Flows

Even with EU regions, some cross-border flows are inevitable:

#### OAuth Providers (Google, Apple, Microsoft)

```
User Device (EU)
         ↓ OAuth redirect
Vercel (Frankfurt) ← Handles redirect
         ↓ OAuth request
Google/Apple/Microsoft (US) ← User data flows here
         ↓ OAuth callback
Vercel (Frankfurt) ← Receives token
         ↓ Token validation
Supabase (Frankfurt) ← Stores user ID
```

**Implications:**
- ⚠️ User email, name may be sent to US during OAuth
- ✅ Only user ID stored in EU (not full profile)
- ✅ Mitigate by: Documenting in privacy policy, using minimal scopes

#### Food Database APIs (Nutritionix, USDA, Open Food Facts)

```
User Device (EU)
         ↓ API request
Vercel (Frankfurt) ← Forwards request
         ↓ API request
Nutritionix/USDA/Open Food Facts (may be US) ← External API
         ↓ API response
Vercel (Frankfurt) ← Caches response (optional)
         ↓ Data storage
Supabase (Frankfurt) ← Stores food data
```

**Implications:**
- ⚠️ API requests may go to US servers
- ✅ Data stored in EU after retrieval
- ✅ Mitigate by: Caching responses, choosing EU-hosted APIs (Open Food Facts is EU-friendly)

#### Vercel Analytics

```
User Device (EU)
         ↓ Page view
Vercel Edge (Frankfurt) ← Collects telemetry
         ↓ Data forwarding
Vercel Analytics (may be US) ← Analytics processing
```

**Implications:**
- ⚠️ Analytics data may be processed in US
- ✅ No personal data (just page views, performance metrics)
- ✅ Mitigate by: Using privacy-friendly analytics, checking Vercel terms

### GDPR Considerations (High Level, Not Legal Advice)

#### Legal Bases for Processing

| Data Type | Recommended Legal Basis | Rationale |
|-----------|------------------------|-----------|
| **User account (email, name)** | Consent (Art. 6(1)(a)) | User consents to create account |
| **Food logs (calories, meals)** | Consent (Art. 6(1)(a)) | User consents to track food |
| **Analytics (page views)** | Legitimate interest (Art. 6(1)(f)) | Performance monitoring, no personal data |
| **OAuth data** | Consent (Art. 6(1)(a)) | User consents to OAuth sign-in |

#### Cross-Border Transfer Safeguards

If data leaves EU (e.g., OAuth, Analytics), you need safeguards:

**EU-US Data Privacy Framework:**
- ✅ Vercel certified
- ✅ Google, Apple, Microsoft certified
- ✅ Adequate level of protection

**Standard Contractual Clauses (SCCs):**
- ⚠️ May need SCCs for non-certified providers (check terms)

**Data Localization:**
- ✅ Core data in EU (Supabase Frankfurt)
- ✅ Compute in EU (Vercel Frankfurt)
- ⚠️ OAuth providers involve US (mitigate with minimal scopes)

#### What to Document

**In Privacy Policy:**

```markdown
## Data Storage & Processing

- **Database:** Frankfurt, Germany (EU) via Supabase
- **Compute:** Frankfurt, Germany (EU) via Vercel
- **Email:** EU region via Resend
- **OAuth:** Google/Apple/Microsoft (certified under EU-US Data Privacy Framework)
- **Food APIs:** [Provider] (may be hosted outside EU, data cached locally)
```

**In Subprocessors List:**

```markdown
## Data Subprocessors

| Subprocessor | Location | Purpose | Legal Basis |
|-------------|----------|---------|-------------|
| Vercel Inc. | US (compute in EU) | Frontend hosting | SCC + EU-US Framework |
| Supabase Inc. | US (data in EU) | Backend/database | SCC + EU-US Framework |
| Resend Inc. | US (email in EU) | Transactional email | SCC + EU-US Framework |
| Google LLC | US | OAuth sign-in | SCC + EU-US Framework |
| Apple Inc. | US | OAuth sign-in | SCC + EU-US Framework |
```

### Practical Steps for EU Residency

1. **Create Supabase project in EU region (eu-central-1)**
2. **Configure Vercel preferredRegion (fra1, dub1)**
3. **Choose Resend EU region (if available)**
4. **Prefer EU-hosted food APIs (Open Food Facts)**
5. **Document all data flows in privacy policy**
6. **List all subprocessors in DPA**
7. **Minimize cross-border transfers (cache API responses)**
8. **Review subprocessor DPAs (Vercel, Supabase, Resend)**

### Verification Checklist

```markdown
✅ Supabase project created in EU region (eu-central-1)
✅ Vercel preferredRegion configured (fra1, dub1)
✅ Vercel region verified (x-vercel-id header shows fra1 or dub1)
✅ Supabase region verified (connection string shows eu-central-1)
✅ Resend EU region selected (if available)
✅ Food API locations documented
✅ OAuth cross-border flows documented
✅ Privacy policy updated with data locations
✅ Subprocessors list created
✅ DPAs reviewed for all subprocessors
```

### Cost Impact

**EU regions typically have no extra cost:**

- ✅ Vercel: Same pricing for all regions
- ✅ Supabase: Same pricing for all regions
- ✅ Resend: Same pricing for all regions

**No cost penalty for EU residency!**

### When EU Residency May Not Be Possible

Some services don't offer EU regions:

- ⚠️ Some food APIs (USDA, Nutritionix)
- ⚠️ Some analytics services
- ⚠️ Some CDN providers

**Mitigation:**
- Document cross-border flows
- Use EU-hosted alternatives where possible
- Implement safeguards (SCCs, DPAs)
- Minimize data sent to non-EU services

---

## 5. Cost Model Ranges: MVP vs Growth

### Cost Assumptions

**For CalorieTracker:**

| Metric | MVP (0-1k users) | Growth (1k-10k users) | Scale (10k-50k users) |
|--------|-----------------|----------------------|----------------------|
| **Page views/month** | 10,000 | 100,000 | 500,000 |
| **API calls/month** | 50,000 | 500,000 | 2,500,000 |
| **Database size** | 10MB | 100MB | 1GB |
| **Email/month** | 100 | 1,000 | 10,000 |
| **Active users** | 100 | 1,000 | 10,000 |

### Vercel + Supabase Cost Model

#### MVP Phase (0-1,000 users)

**Free Tier (€0/month):**

| Component | Usage | Included | Cost |
|-----------|-------|----------|------|
| Vercel Hobby | 10GB bandwidth, 600 min exec | 100GB, 6000 min | Free |
| Supabase Free | 10MB DB, 100MB storage | 500MB, 1GB | Free |
| Resend Free | 100 emails | 3,000 emails | Free |
| **Total** | | | **€0/month** |

**Can stay free until:**
- More than 100GB bandwidth (Vercel)
- More than 500MB database (Supabase)
- More than 50,000 MAU (Supabase)
- More than 3,000 emails (Resend)

**Estimated time to hit limits:**
- 1-3 months if viral launch
- 6-12 months if organic growth

#### Growth Phase (1,000-10,000 users)

**Pro Tier (~€40/month):**

| Component | Usage | Included | Cost |
|-----------|-------|----------|------|
| Vercel Pro | 100GB bandwidth, 1,000 min exec | 1TB, 10,000 GB-hr | $20/mo (~€18) |
| Supabase Pro | 100MB DB, 500MB storage | 8GB, 100GB | $25/mo (~€23) |
| Resend Free | 1,000 emails | 3,000 emails | Free |
| **Total** | | | **~€41/month** |

**Upgrade triggers:**
- More than 100GB bandwidth (Vercel)
- More than 500MB database (Supabase)
- More than 50,000 MAU (Supabase)

**Estimated cost scaling:**
- 1,000 users: €41/month
- 5,000 users: €41/month (still within Pro limits)
- 10,000 users: €41/month (still within Pro limits)

#### Scale Phase (10,000-50,000 users)

**Pro Tier (~€65/month):**

| Component | Usage | Included | Cost |
|-----------|-------|----------|------|
| Vercel Pro | 500GB bandwidth, 5,000 min exec | 1TB, 10,000 GB-hr | $20/mo (~€18) |
| Supabase Pro | 1GB DB, 5GB storage | 8GB, 100GB | $25/mo (~€23) |
| Resend Pro | 10,000 emails | 50,000 emails | $20/mo (~€18) |
| **Total** | | | **~€59/month** |

**Supabase Scale Option (for 50k+ users):**

| Component | Usage | Included | Cost |
|-----------|-------|----------|------|
| Vercel Pro | 500GB bandwidth, 5,000 min exec | 1TB, 10,000 GB-hr | $20/mo (~€18) |
| Supabase Scale | 1GB DB, 5GB storage | 100GB, 500GB | $50/mo (~€46) |
| Resend Pro | 10,000 emails | 50,000 emails | $20/mo (~€18) |
| **Total** | | | **~€82/month** |

### Alternative Providers Cost Comparison

#### Fly.io Cost Model

**MVP (~€10/month):**

| Component | Cost |
|-----------|------|
| Fly.io Apps (Next.js) | $5/mo |
| PostgreSQL (managed) | $5/mo |
| Resend Free | Free |
| **Total** | **~€10/month** |

**Growth (~€20/month):**

| Component | Cost |
|-----------|------|
| Fly.io Apps | $10/mo |
| PostgreSQL | $10/mo |
| Resend Pro | $20/mo |
| **Total** | **~€37/month** |

#### Cloudflare Cost Model

**MVP (~€5/month):**

| Component | Cost |
|-----------|------|
| Cloudflare Pages | Free |
| Workers (API routes) | $5/mo (1M requests) |
| D1 Database (SQL) | Free (5GB) |
| Resend Free | Free |
| **Total** | **~€5/month** |

**Growth (~€20/month):**

| Component | Cost |
|-----------|------|
| Cloudflare Pages | Free |
| Workers | $5/mo |
| D1 Database | $0.75/mo (5GB) |
| Resend Pro | $20/mo |
| **Total** | **~€23/month** |

#### Render Cost Model

**MVP (~€14/month):**

| Component | Cost |
|-----------|------|
| Web Service | $7/mo |
| PostgreSQL | $7/mo |
| Resend Free | Free |
| **Total** | **~€14/month** |

**Growth (~€28/month):**

| Component | Cost |
|-----------|------|
| Web Service | $7/mo |
| PostgreSQL | $7/mo |
| Resend Pro | $20/mo |
| **Total** | **~€31/month** |

#### Hetzner/VPS Cost Model

**MVP (~€5/month):**

| Component | Cost |
|-----------|------|
| VPS (CX22) | €4.79/mo |
| PostgreSQL | Included |
| Let's Encrypt SSL | Free |
| **Total** | **~€5/month** |

**Growth (~€15/month):**

| Component | Cost |
|-----------|------|
| VPS (CX22) | €4.79/mo |
| Backup storage | €4.79/mo |
| Grafana Cloud (monitoring) | $10/mo (~€9) |
| **Total** | **~€15/month** |

### Cost Summary Comparison

| Stage | Vercel+Supabase | Fly.io | Cloudflare | Render | Hetzner/VPS |
|-------|----------------|--------|------------|--------|-------------|
| **MVP (1k users)** | €0 (free) | €10 | €5 | €14 | €5 |
| **Growth (10k users)** | €41 | €37 | €23 | €31 | €15 |
| **Scale (50k users)** | €59-82 | €60+ | €40+ | €50+ | €30+ |

### Hidden Costs to Consider

#### Development Time

| Option | Setup Time | Monthly Ops Time |
|--------|------------|------------------|
| Vercel+Supabase | 1 hour | 1-2 hours |
| Fly.io | 2-4 hours | 2-3 hours |
| Cloudflare | 4-8 hours | 2-4 hours |
| Render | 2-4 hours | 2-3 hours |
| Hetzner/VPS | 2-4 days | 4-8 hours |

**Opportunity cost:** Time spent on DevOps is time not spent on features.

#### Overhead Costs

| Item | Vercel+Supabase | Hetzner/VPS |
|------|----------------|-------------|
| SSL certificates | Included | Free (Let's Encrypt) |
| Monitoring | Included | Free (Prometheus) or paid (Grafana Cloud €9/mo) |
| Backups | Included (Supabase) | Manual or paid (€5/mo) |
| DDoS protection | Included | Need Cloudflare (free) |
| CI/CD | Included | Need GitHub Actions (free) |

#### Scalability Costs

| Scale | Vercel+Supabase | Hetzner/VPS |
|-------|----------------|-------------|
| 100k users | ~€100-150/mo | Need bigger VPS (€20-30/mo) + load balancing |
| 1M users | ~€500-1000/mo | Multiple VPSs + complex setup (€100-200/mo) |

### Cost Optimization Strategies

#### For Vercel + Supabase

1. **Optimize bandwidth:**
   - Use ISR (Incremental Static Regeneration) for static pages
   - Compress images (Next.js Image component)
   - Lazy load components

2. **Optimize execution time:**
   - Cache Supabase queries (React Query, SWR)
   - Batch database operations
   - Use Edge Functions for low-latency operations

3. **Optimize storage:**
   - Implement data retention (30-day soft delete, then purge)
   - Don't store images locally (use Supabase Storage)
   - Compress data where possible

4. **Optimize email:**
   - Use email digests instead of immediate notifications
   - Only send essential emails (verification, password reset)
   - Use transactional email only, not marketing

#### For Hetzner/VPS

1. **Optimize resources:**
   - Use Nginx for caching
   - Enable gzip compression
   - Use CDN (Cloudflare) for static assets

2. **Optimize database:**
   - Regular VACUUM and ANALYZE
   - Index optimization
   - Connection pooling (PgBouncer)

3. **Optimize costs:**
   - Use spot instances (if available)
   - Scale down during off-hours (if possible)
   - Use Hetzner Auction for cheaper servers

### Cost Breakdown by User Count

**Vercel + Supabase (recommended):**

| Users | Monthly Cost | Cost Per User |
|-------|--------------|---------------|
| 0-1,000 | €0 (free tier) | €0 |
| 1,000 | €41 | €0.041/user |
| 5,000 | €41 | €0.008/user |
| 10,000 | €41 | €0.004/user |
| 25,000 | €59 | €0.002/user |
| 50,000 | €82 | €0.002/user |
| 100,000 | €150 | €0.002/user |

**Key Insight:** Cost per user decreases as you scale. Fixed costs dominate at low user counts.

### Budget Planning

**Scenario 1: Slow Growth (Organic)**
- Months 1-3: Free tier (€0)
- Months 4-6: Pro tier (€41/mo)
- Months 7-12: Pro tier (€41/mo)
- **Year 1 Total: €246**

**Scenario 2: Fast Growth (Viral)**
- Months 1-2: Free tier (€0)
- Months 3-6: Pro tier (€41/mo)
- Months 7-12: Scale tier (€82/mo)
- **Year 1 Total: €498**

**Scenario 3: High Growth (Product-Market Fit)**
- Months 1-2: Free tier (€0)
- Months 3-6: Pro tier (€41/mo)
- Months 7-12: Enterprise tier (€150/mo)
- **Year 1 Total: €900**

### Cost vs Features Tradeoff

| Option | Cost | Features | Dev Experience |
|--------|------|----------|----------------|
| Vercel+Supabase | €0-150/mo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Fly.io | €10-60/mo | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Cloudflare | €5-40/mo | ⭐⭐⭐ | ⭐⭐⭐ |
| Render | €14-50/mo | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Hetzner/VPS | €5-30/mo | ⭐⭐⭐ | ⭐⭐ |

**Conclusion:** Vercel+Supabase offers the best value when you consider:
- Feature set
- Developer experience
- Operational complexity
- Time to market

The slight cost premium over cheaper alternatives is justified by:
- Less DevOps overhead (saves 10-20 hours/month)
- Faster development (preview deployments, auto-SSL)
- Better reliability (managed infrastructure)
- Easier scaling (automatic scaling, no manual intervention)

---

## 6. Operational Complexity

### What Is Operational Complexity?

**Operational complexity** = Time and effort required to keep your app running smoothly.

**Includes:**
- CI/CD setup and maintenance
- Log management and monitoring
- Secrets management and rotation
- Scaling and performance tuning
- Security patching and updates
- Backup and disaster recovery
- Error handling and debugging

### Complexity Comparison

| Provider | Setup Time | Monthly Ops | CI/CD | Monitoring | Secrets |
|----------|------------|-------------|-------|------------|---------|
| **Vercel** | 1 hour | 1-2 hours | Built-in | Built-in | Built-in |
| Fly.io | 2-4 hours | 2-3 hours | Built-in | Basic | Built-in |
| Cloudflare | 4-8 hours | 2-4 hours | Manual | Basic | Built-in |
| Render | 2-4 hours | 2-3 hours | Built-in | Basic | Built-in |
| Hetzner/VPS | 2-4 days | 4-8 hours | Manual | Complex | Manual |

### Vercel + Supabase Complexity Analysis

#### Setup Complexity (Low)

**What you need to do (1 hour total):**

1. **Vercel Setup (15 min):**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link project
   cd /path/to/calorietracker
   vercel link

   # Deploy
   vercel --prod
   ```

2. **Environment Variables (15 min):**
   ```bash
   # Set environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add RESEND_API_KEY production
   vercel env add NEXT_PUBLIC_APP_URL production
   ```

3. **Git Integration (10 min):**
   - Connect GitHub repo to Vercel (5 min)
   - Configure build settings (5 min)

4. **Supabase Setup (15 min):**
   - Create account (5 min)
   - Create project (5 min)
   - Configure auth providers (5 min)

5. **Resend Setup (5 min):**
   - Create account (2 min)
   - Get API key (2 min)
   - Configure domain (1 min)

**Total: 1 hour**

**Zero custom infrastructure:**
- No SSH keys to manage
- No servers to configure
- No SSL certificates (handled automatically)
- No load balancers
- No monitoring setup

#### CI/CD Complexity (Minimal)

**Vercel handles CI/CD automatically:**

```yaml
# No GitHub Actions needed! Vercel provides:
✅ Automatic builds on push
✅ Preview deployments for PRs
✅ Production deployments on main branch merge
✅ Rollback capability
✅ Environment variable management
```

**Deployment workflow:**

```bash
# 1. Create feature branch
git checkout -b feature/add-oauth

# 2. Make changes
# ... code changes ...

# 3. Commit and push
git add .
git commit -m "Add OAuth"
git push origin feature/add-oauth

# 4. Vercel automatically creates preview deployment
# https://feature-add-oauth-your-app.vercel.app

# 5. Test on preview URL

# 6. Create PR on GitHub
# Preview URL is automatically added to PR

# 7. Merge PR
# Vercel automatically deploys to production
```

**Custom CI (if needed):**

```javascript
// vercel.json (optional)
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["fra1", "dub1"]
}
```

**No need for:**
- ❌ GitHub Actions workflows
- ❌ Docker containers
- ❌ CI servers
- ❌ Build scripts

#### Monitoring Complexity (Low)

**Vercel provides built-in monitoring:**

```
Vercel Dashboard → Analytics
├── Real-time logs
├── Build logs
├── Function logs
├── Error tracking
├── Performance metrics
└── Web Vitals (CLS, FID, LCP)
```

**Supabase provides built-in monitoring:**

```
Supabase Dashboard → Logs
├── Database logs
├── Auth logs
├── API logs
└── Realtime logs
```

**No setup required:**

- ✅ Logs automatically collected
- ✅ Errors automatically tracked
- ✅ Performance metrics automatically measured
- ✅ Alerts automatically sent (email, Slack)

**Custom monitoring (optional):**

```typescript
// Example: Custom error logging
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Your code here
  } catch (error) {
    // Log to Supabase
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.from('security_events').insert({
      event_type: 'error',
      severity: 'error',
      message: error.message,
      stack_trace: error.stack
    })

    // Re-throw for Vercel to catch
    throw error
  }
}
```

#### Secrets Management Complexity (Minimal)

**Vercel provides built-in secrets management:**

```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter value when prompted (hidden)

# Via Dashboard
# Vercel Dashboard → Project → Settings → Environment Variables
```

**Best practices:**

- ✅ Secrets are encrypted at rest
- ✅ Secrets are never shown in logs
- ✅ Secrets are per-environment (production, preview, development)
- ✅ Public variables prefixed with `NEXT_PUBLIC_`
- ✅ Service role keys hidden from client

**No need for:**
- ❌ Vault/HashiCorp
- ❌ AWS Secrets Manager
- ❌ Kubernetes secrets
- ❌ .env files in git (avoid!)

#### Scaling Complexity (Low)

**Vercel auto-scales automatically:**

- ✅ Serverless functions scale to zero (no cost when idle)
- ✅ Serverless functions scale up to thousands of concurrent requests
- ✅ Edge network handles traffic spikes
- ✅ No manual scaling needed

**Supabase auto-scales automatically:**

- ✅ Database connections pooled
- ✅ Storage scales automatically
- ✅ Auth scales automatically
- ✅ No manual scaling needed

**No need for:**
- ❌ Auto-scaling groups
- ❌ Load balancers
- ❌ Horizontal pod autoscalers
- ❌ Manual capacity planning

#### Security Patching Complexity (Minimal)

**Vercel handles security automatically:**

- ✅ Automatic SSL/TLS renewal
- ✅ DDoS protection
- ✅ WAF (Web Application Firewall)
- ✅ Security headers managed

**Supabase handles security automatically:**

- ✅ PostgreSQL security patches
- ✅ Auth security patches
- ✅ Storage security patches

**No need for:**
- ❌ Manual SSL certificate renewal
- ❌ Manual security patching
- ❌ Manual WAF configuration
- ❌ Manual security header setup

#### Backup & Disaster Recovery Complexity (Low)

**Supabase provides automatic backups:**

```
Supabase Dashboard → Database → Backups
├── Daily backups (Pro plan)
├── Point-in-time recovery (up to 7 days)
└── Manual backups
```

**No need for:**
- ❌ Manual backup scripts
- ❌ Off-site backup storage
- ❌ Backup monitoring
- ❌ Disaster recovery planning

**Optional:**

```bash
# Manual backup (optional)
supabase db dump -f backup.sql

# Restore backup (optional)
supabase db reset --db-url "postgresql://..."
```

#### Error Handling & Debugging Complexity (Low)

**Vercel provides built-in error tracking:**

```
Vercel Dashboard → Functions → Logs
├── Real-time logs
├── Error logs
├── Stack traces
└── Request/response logs
```

**Supabase provides built-in error tracking:**

```
Supabase Dashboard → Logs
├── Database errors
├── Auth errors
├── API errors
└── Real-time errors
```

**Debugging workflow:**

1. User reports error
2. Check Vercel logs (timestamp, stack trace)
3. Check Supabase logs (database errors, auth errors)
4. Reproduce error locally
5. Fix and deploy

**No need for:**
- ❌ Sentry (optional, but Vercel logs are sufficient for MVP)
- ❌ Datadog (optional, but Supabase dashboard is sufficient)
- ❌ ELK stack (optional, but overkill for MVP)

#### Monthly Operations Breakdown

**Vercel + Supabase (1-2 hours/month):**

```
Daily (5 min):
├── Check Vercel dashboard for errors (2 min)
└── Check Supabase dashboard for usage (3 min)

Weekly (30 min):
├── Review error logs (10 min)
├── Check usage limits (10 min)
└── Update dependencies (10 min)

Monthly (1 hour):
├── Review costs (10 min)
├── Test GDPR endpoints (20 min)
├── Check backup status (10 min)
├── Review security events (10 min)
└── Update documentation (10 min)
```

**Total: 1-2 hours/month**

#### Comparison with Hetzner/VPS

**Hetzner/VPS (4-8 hours/month):**

```
Daily (15-30 min):
├── Check server logs (5 min)
├── Monitor disk usage (5 min)
├── Check PostgreSQL status (5 min)
├── Monitor SSL certificates (5 min)
└── Check Nginx status (5 min)

Weekly (2-3 hours):
├── Review error logs (30 min)
├── Check backup status (30 min)
├── Security updates (30 min)
├── Monitor performance (30 min)
└── Test failover (30 min)

Monthly (2-4 hours):
├── Full security audit (1 hour)
├── Update OS packages (30 min)
├── Update PostgreSQL (30 min)
├── Update Node.js (30 min)
├── Rotate secrets (30 min)
├── Test backup restoration (30 min)
└── Update monitoring dashboards (30 min)
```

**Total: 4-8 hours/month**

**Key difference:**
- Vercel+Supabase: 1-2 hours/month
- Hetzner/VPS: 4-8 hours/month
- **Savings: 2-6 hours/month = 24-72 hours/year**

### Complexity vs Cost Tradeoff

| Option | Setup Time | Monthly Ops | Annual Ops Time | Annual Cost (10k users) | Total Annual Cost (Time + Money) |
|--------|------------|-------------|-----------------|-------------------------|----------------------------------|
| **Vercel+Supabase** | 1 hour | 2 hours | 24 hours | €492 | €492 + 24h × €100/h = **€2,892** |
| Fly.io | 3 hours | 3 hours | 36 hours | €444 | €444 + 36h × €100/h = **€4,044** |
| Cloudflare | 6 hours | 4 hours | 48 hours | €276 | €276 + 48h × €100/h = **€5,076** |
| Render | 3 hours | 3 hours | 36 hours | €372 | €372 + 36h × €100/h = **€3,972** |
| Hetzner/VPS | 24 hours | 6 hours | 72 hours | €180 | €180 + 72h × €100/h = **€7,380** |

**Assumption:** Your time is worth €100/hour (developer consulting rate)

**Conclusion:** Vercel+Supabase is the most cost-effective when you factor in your time.

### Complexity Reduction Strategies

#### For Vercel + Supabase (already minimal)

1. **Automate routine checks:**
   ```bash
   # Example: Daily health check script
   #!/bin/bash
   # Check Vercel errors
   vercel logs --since 24h --error

   # Check Supabase usage
   supabase status
   ```

2. **Set up alerts:**
   - Vercel: Error rate > 5% → Email alert
   - Supabase: Database usage > 80% → Email alert
   - Resend: Email quota > 90% → Email alert

3. **Document everything:**
   - Deployment procedures
   - Troubleshooting guides
   - Onboarding for collaborators

#### For Hetzner/VPS (if you choose it)

1. **Use managed services:**
   - Hetzner Cloud Database (PostgreSQL managed)
   - Cloudflare for CDN and DDoS protection
   - Grafana Cloud for monitoring

2. **Automate everything:**
   - Ansible/Terraform for infrastructure as code
   - GitHub Actions for CI/CD
   - Cron jobs for backups and updates

3. **Use monitoring tools:**
   - Prometheus for metrics
   - Grafana for dashboards
   - Alertmanager for alerts

---

## 7. Recommended Staged Rollout Plan

### Overview

**Goal:** Deploy CalorieTracker in stages to minimize risk and ensure smooth production launch.

**Stages:**
1. **Local Development** - Build and test locally
2. **Preview Deployments** - Test on live URLs for each PR
3. **Staging Environment** - Production-like environment for final testing
4. **Production Launch** - Gradual rollout to real users

### Stage 1: Local Development (Weeks 1-3)

#### Setup

```bash
# 1. Create Next.js project
npm create next-app@latest calorietracker
cd calorietracker

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zod react-hook-form

# 3. Install Supabase CLI
npm install -g supabase

# 4. Start local Supabase
supabase start

# 5. Start Next.js dev server
npm run dev
```

#### Environment Configuration

```bash
# .env.local (never commit to git)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
RESEND_API_KEY=mock_for_dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Development Checklist

```markdown
Week 1: Foundation
├── Set up Next.js project
├── Set up Supabase local
├── Create database schema
├── Implement RLS policies
└── Set up authentication (email/password)

Week 2: Core Features
├── Implement food database API integration
├── Build food logging UI
├── Implement daily aggregation
├── Build stats dashboard
└── Implement goal tracking

Week 3: GDPR & Security
├── Implement GDPR endpoints (export, delete)
├── Build privacy page
├── Implement consent management
├── Implement security event logging
└── Write privacy policy (legal review)
```

#### Testing Checklist

```markdown
✅ Database migrations work locally
✅ Authentication flows work (email/password)
✅ RLS policies tested with different users
✅ Food logging works end-to-end
✅ Stats dashboard displays correctly
✅ GDPR export returns complete data
✅ GDPR delete removes all data
✅ Consent management works
✅ Security events are logged
✅ No errors in browser console
✅ Responsive design (desktop, tablet, mobile)
```

#### Exit Criteria

- [ ] All core features working locally
- [ ] All GDPR endpoints tested
- [ ] Security tests passing
- [ ] No critical bugs
- [ ] Code committed to GitHub

---

### Stage 2: Preview Deployments (Weeks 4-5)

#### Setup

```bash
# 1. Connect GitHub repo to Vercel
# https://vercel.com/new
# Select GitHub repo → Import

# 2. Configure build settings
# Framework: Next.js
# Build Command: npm run build
# Output Directory: .next

# 3. Set environment variables (Preview)
# Vercel Dashboard → Project → Settings → Environment Variables
# Add: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.
# Use preview Supabase project (not production)
```

#### Preview Deployment Workflow

```bash
# 1. Create feature branch
git checkout -b feature/food-logging-ui

# 2. Make changes
# ... code changes ...

# 3. Commit and push
git add .
git commit -m "Improve food logging UI"
git push origin feature/food-logging-ui

# 4. Vercel automatically creates preview deployment
# https://feature-food-logging-ui-your-app.vercel.app

# 5. Test on preview URL
# Open in browser, test features

# 6. Create PR on GitHub
# Preview URL is automatically added to PR description

# 7. Request review from friend/colleague
# They can test on preview URL without installing anything

# 8. Merge PR
# Vercel automatically deploys to production (or staging)
```

#### Preview Environment Configuration

```javascript
// next.config.mjs
const isPreview = process.env.VERCEL_ENV === 'preview'

export const preferredRegion = ['fra1', 'dub1']

// For preview, use preview Supabase project
const supabaseUrl = isPreview
  ? process.env.NEXT_PUBLIC_SUPABASE_PREVIEW_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL

export default {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl
  }
}
```

#### Testing Checklist

```markdown
For each PR:
├── Preview deployment created successfully
├── Preview URL loads without errors
├── New feature works on preview URL
├── Existing features still work (regression testing)
├── GDPR endpoints still work
├── No console errors
├── Responsive design still works
└── Performance acceptable (<3s load time)
```

#### Exit Criteria

- [ ] All PRs tested on preview URLs
- [ ] No regression bugs
- [ ] Performance acceptable
- [ ] Friend/colleague tested and approved

---

### Stage 3: Staging Environment (Week 6)

#### Setup

```bash
# 1. Create staging environment in Vercel
# Vercel Dashboard → Project → Settings → Environments
# Add "Staging" environment

# 2. Create staging branch in GitHub
git checkout -b staging

# 3. Deploy staging branch to Vercel
# Vercel Dashboard → Project → Git
# Configure: staging branch → staging environment

# 4. Set environment variables (Staging)
# Vercel Dashboard → Project → Settings → Environment Variables → Staging
# Use production Supabase project (or separate staging project)
```

#### Staging Environment Configuration

```javascript
// next.config.mjs
const isStaging = process.env.VERCEL_ENV === 'production' &&
                  process.env.VERCEL_GIT_COMMIT_REF === 'staging'

export const preferredRegion = ['fra1', 'dub1']

// For staging, use production Supabase (or separate staging Supabase)
const supabaseUrl = isStaging
  ? process.env.NEXT_PUBLIC_SUPABASE_STAGING_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL

export default {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_APP_URL: isStaging
      ? 'https://staging.your-app.com'
      : 'https://your-app.com'
  }
}
```

#### Staging URL

```
https://staging.your-app.com
or
https://your-app-staging.vercel.app
```

#### Testing Checklist

```markdown
Week 6: Staging Testing
├── Deploy to staging
├── Test all core features on staging
├── Test GDPR endpoints on staging
├── Test authentication flows on staging
├── Test email delivery (Resend)
├── Test OAuth flows (Google, Apple, Microsoft)
├── Load testing (simulate 100 users)
├── Performance testing (Lighthouse score >90)
├── Security testing (RLS policies, auth)
└── Legal review of privacy policy
```

#### Load Testing

```bash
# Example: Simple load test with Apache Bench
# Install: brew install ab (macOS)

# Test food logging endpoint
ab -n 1000 -c 10 -p food_log.json -T application/json \
  https://staging.your-app.com/api/food/log

# Test stats endpoint
ab -n 1000 -c 10 \
  https://staging.your-app.com/api/stats/daily
```

#### Performance Testing

```bash
# Use Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse on staging
lhci autorun --collect.url=https://staging.your-app.com

# Target scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >90
# SEO: >95
```

#### Exit Criteria

- [ ] All features working on staging
- [ ] Performance scores acceptable (>90)
- [ ] Load testing passed (no 500 errors)
- [ ] Security tests passing
- [ ] Legal review complete
- [ ] Privacy policy approved

---

### Stage 4: Production Launch (Week 7)

#### Setup

```bash
# 1. Create production Supabase project
# Supabase Dashboard → New Project
# Region: eu-central-1 (Frankfurt)
# Name: calorietracker-production

# 2. Run migrations on production
supabase db push --db-url "postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres"

# 3. Configure production environment variables in Vercel
# Vercel Dashboard → Project → Settings → Environment Variables → Production
# Add: NEXT_PUBLIC_SUPABASE_URL (production), etc.

# 4. Configure custom domain
# Vercel Dashboard → Project → Domains
# Add: your-app.com (or calorietracker.app)
```

#### Production Deployment

```bash
# 1. Merge staging to main
git checkout main
git merge staging

# 2. Push to GitHub
git push origin main

# 3. Vercel automatically deploys to production
# https://your-app.com

# 4. Verify deployment
# Check Vercel Dashboard → Deployments
# Should show "Ready" status

# 5. Test production
# Open https://your-app.com
# Test core features
```

#### Gradual Rollout

**Option 1: Beta Launch (Invite-only)**

```markdown
Week 7-8: Beta Launch
├── Share app with 10-20 friends/family
├── Collect feedback
├── Monitor errors and performance
├── Fix critical bugs
├── Iterate based on feedback
└── Prepare for public launch
```

**Option 2: Soft Launch (Public, but unannounced)**

```markdown
Week 7-8: Soft Launch
├── Launch to public (no marketing)
├── Share on personal social media
├── Monitor usage and errors
├── Fix issues as they arise
├── Optimize based on real usage
└── Prepare for marketing push
```

**Option 3: Hard Launch (Public + marketing)**

```markdown
Week 7+: Hard Launch
├── Launch to public
├── Marketing push (social media, Product Hunt, etc.)
├── Monitor usage spikes
├── Scale if needed (upgrade plans)
├── Respond to user feedback
└── Continuous iteration
```

#### Recommended: Beta Launch → Soft Launch → Hard Launch

```markdown
Week 7-8: Beta Launch (10-20 users)
├── Invite friends/family
├── Collect detailed feedback
├── Fix critical bugs
└── Polish UX

Week 9-10: Soft Launch (100-500 users)
├── Share on personal social media
├── List in directories (Indie Hackers, etc.)
├── Monitor usage and errors
├── Optimize performance
└── Prepare for hard launch

Week 11+: Hard Launch (Public)
├── Product Hunt launch
├── Reddit launch (r/SideProject, r/CalorieCounter)
├── Social media marketing
├── Influencer outreach (if budget)
└── Iterate based on feedback
```

#### Monitoring Checklist

```markdown
Day 1: Launch Day
├── Monitor Vercel logs (check every hour)
├── Monitor Supabase usage (check every hour)
├── Monitor error rate (target: <1%)
├── Monitor performance (target: <3s load time)
├── Respond to user emails/support
└── Fix critical bugs immediately

Week 1: First Week
├── Monitor usage trends (daily)
├── Monitor error trends (daily)
├── Monitor user feedback (daily)
├── Review security events (daily)
├── Test GDPR endpoints (weekly)
└── Update documentation (if needed)

Month 1: First Month
├── Review costs (weekly)
├── Review usage trends (weekly)
├── Review error trends (weekly)
├── Test all GDPR rights (weekly)
├── Review subprocessor list (monthly)
└── Legal review (monthly)
```

#### Rollback Plan

```markdown
If critical issues arise:
├── Option 1: Vercel rollback (one-click)
│   └── Vercel Dashboard → Deployments → Select previous deployment → Revert
│
├── Option 2: Git rollback (manual)
│   └── git revert HEAD → git push → Vercel auto-deploys
│
└── Option 3: Maintenance mode (temporary)
    └── Set NEXT_PUBLIC_MAINTENANCE_MODE=true → Vercel redeploys
```

#### Exit Criteria

- [ ] No critical bugs in production
- [ ] Error rate <1%
- [ ] Performance acceptable (>90 Lighthouse score)
- [ ] User feedback positive
- [ ] GDPR endpoints working
- [ ] Cost within budget
- [ ] Legal compliance verified

---

### Post-Launch Operations

#### Daily (5-10 minutes)

```markdown
☐ Check Vercel dashboard for errors
☐ Check Supabase dashboard for usage
☐ Review user feedback (email, social media)
☐ Respond to support requests
```

#### Weekly (30-60 minutes)

```markdown
☐ Review error logs and trends
☐ Review usage statistics
☐ Check free tier limits (approaching?)
☐ Update dependencies (security patches)
☐ Review user feedback
☐ Plan features/fixes for next sprint
```

#### Monthly (1-2 hours)

```markdown
☐ Review costs (Vercel, Supabase, Resend)
☐ Review growth metrics (users, usage, engagement)
☐ Test GDPR endpoints (export, delete)
☐ Check backup status (Supabase)
☐ Review security events
☐ Update documentation
☐ Plan roadmap for next month
```

#### Quarterly (2-4 hours)

```markdown
☐ Full GDPR compliance review
☐ Re-verify EU routing (Vercel + Supabase)
☐ Review subprocessor list (add/remove)
☐ Test all GDPR rights (comprehensive)
☐ Legal review of privacy policy (if changed)
☐ Security audit (RLS policies, auth)
☐ Performance audit (optimization opportunities)
☐ Cost audit (optimization opportunities)
☐ Roadmap planning (next quarter)
```

---

### Summary Timeline

| Week | Stage | Goal | Deliverable |
|------|-------|------|-------------|
| 1-3 | Local Development | Build and test locally | Working app locally |
| 4-5 | Preview Deployments | Test on live URLs per PR | All PRs tested on preview |
| 6 | Staging Environment | Production-like testing | Staging environment tested |
| 7 | Production Launch | Deploy to production | Live production app |
| 7-8 | Beta Launch | Invite 10-20 users | Feedback and polish |
| 9-10 | Soft Launch | Public, unannounced | 100-500 users |
| 11+ | Hard Launch | Public + marketing | Public launch |

**Total time to production:** 7 weeks
**Total time to public launch:** 10-11 weeks (including beta/soft launch)

---

## Conclusion & Recommendation

### Recommended Path for CalorieTracker

**Vercel + Supabase is the clear winner** for CalorieTracker based on:

1. **Developer Experience:** Best Next.js integration, preview deployments, zero-config SSL
2. **Operational Complexity:** Minimal (1-2 hours/month vs 4-8 hours/month for VPS)
3. **Cost:** Reasonable (€0-150/mo) with predictable scaling
4. **EU Support:** Excellent (Frankfurt region for both Vercel and Supabase)
5. **GDPR Compliance:** Built-in features, proven in PdfExtractorAi
6. **Time to Market:** 7 weeks to production (vs 2-3 months for VPS)

### Final Recommendation

| Component | Choice | Reason |
|-----------|--------|--------|
| **Frontend Hosting** | Vercel (Pro plan) | Best Next.js DX, EU regions, auto-scaling |
| **Backend Hosting** | Supabase (Pro plan) | EU regions, RLS, auth, managed PostgreSQL |
| **Email** | Resend (Free/Pro) | EU region available, transactional email |
| **Monitoring** | Vercel + Supabase (built-in) | Sufficient for MVP, no extra setup |
| **CI/CD** | Vercel Git integration | Automatic deployments, preview URLs |

### Alternative (If Budget Is Critical)

**Cloudflare Pages + Workers + D1:**

| Component | Choice | Cost |
|-----------|--------|------|
| Frontend | Cloudflare Pages | Free |
| Backend | Cloudflare Workers | $5/mo |
| Database | Cloudflare D1 | Free |
| Email | Resend Free | Free |
| **Total** | | **~€5/mo** |

**Tradeoffs:**
- ✅ Cheaper (~€5/mo vs €41/mo for Vercel+Supabase Pro)
- ❌ More complex setup (4-8 hours vs 1 hour)
- ❌ Less mature Next.js support
- ❌ Fewer integrations

**Recommendation:** Start with Vercel+Supabase (Pro tier) for MVP, consider Cloudflare for cost optimization at scale (10k+ users).

---

## Next Steps

1. **Set up local development** (Week 1)
   - Create Next.js project
   - Start Supabase local
   - Build core features

2. **Connect GitHub to Vercel** (Week 4)
   - Create Vercel account
   - Import GitHub repo
   - Configure build settings

3. **Create Supabase project in EU** (Week 4)
   - Choose eu-central-1 (Frankfurt)
   - Get credentials
   - Configure auth providers

4. **Set up preview deployments** (Week 4)
   - Test on preview URLs
   - Get feedback from friends

5. **Deploy to staging** (Week 6)
   - Production-like environment
   - Load testing
   - Performance testing

6. **Launch to production** (Week 7)
   - Deploy to production
   - Beta launch (10-20 users)
   - Soft launch (100-500 users)
   - Hard launch (public)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-15
**Next Review:** After production launch (2026-04-01)
