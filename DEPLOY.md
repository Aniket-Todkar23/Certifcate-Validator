# 🚀 PramanMitra - Vercel + Neon Deployment Guide

## ✅ Pre-Deployment Status
- **Frontend**: Production build ready (0 warnings)
- **Backend**: PostgreSQL-ready with Neon integration
- **Database**: SQLite → Neon PostgreSQL migration script included

---

## 📋 Quick Setup Steps

### 1️⃣ Set Up Neon PostgreSQL Database

1. **Create Neon Account**
   - Go to [https://neon.tech](https://neon.tech)
   - Sign up for free (includes 0.5 GB storage)

2. **Create Database**
   - Click "Create Database"
   - Choose region closest to your users
   - Copy the connection string (looks like: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

3. **Save Connection String**
   - Keep this safe, you'll need it for backend deployment

### 2️⃣ Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [https://railway.app](https://railway.app)
   - Sign in with GitHub

2. **Deploy Backend**
   ```bash
   cd backend
   
   # Install Railway CLI (if not installed)
   npm install -g @railway/cli
   
   # Login and create project
   railway login
   railway init
   ```

3. **Configure Environment Variables in Railway Dashboard**
   ```env
   FLASK_ENV=production
   SECRET_KEY=<generate-random-32-char-string>
   JWT_SECRET_KEY=<generate-random-32-char-string>
   NEON_DATABASE_URL=<your-neon-connection-string>
   CORS_ORIGINS=https://your-app.vercel.app
   TESSERACT_CMD=tesseract
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Get Backend URL**
   - Railway will provide URL like: `https://your-app.up.railway.app`
   - Note this for frontend configuration

### 3️⃣ Deploy Frontend to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Frontend Environment**
   ```bash
   cd frontend
   
   # Create production environment file
   echo "REACT_APP_API_URL=https://your-backend.up.railway.app/api" > .env.production
   ```

3. **Deploy to Vercel**
   ```bash
   # Build and deploy
   vercel --prod
   
   # Follow prompts:
   # - Set up and deploy: Y
   # - Which scope: (select your account)
   # - Link to existing project: N
   # - Project name: pramanmitra-frontend
   # - Directory: ./
   # - Override settings: N
   ```

4. **Configure Production Environment in Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project → Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_URL = https://your-backend.up.railway.app/api
     ```

### 4️⃣ Migrate Data to Neon (If you have existing data)

1. **Set up migration environment**
   ```bash
   cd backend
   
   # Create .env file with Neon connection
   echo "NEON_DATABASE_URL=<your-neon-connection-string>" > .env
   ```

2. **Install dependencies**
   ```bash
   pip install psycopg2-binary python-dotenv
   ```

3. **Run migration**
   ```bash
   python migrate_to_neon.py
   
   # Verify migration
   python migrate_to_neon.py verify
   ```

---

## 🔧 Configuration Files

### Backend (.env)
```env
FLASK_ENV=production
SECRET_KEY=<generate-using-secrets-library>
JWT_SECRET_KEY=<generate-using-secrets-library>
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
CORS_ORIGINS=https://pramanmitra.vercel.app
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://pramanmitra-backend.up.railway.app/api
```

---

## 🎯 Post-Deployment Checklist

### Immediate Steps
- [ ] Test homepage loads with auto-playing video
- [ ] Test user registration and login
- [ ] Test certificate upload and verification
- [ ] Test admin dashboard (create admin user first)
- [ ] Test OCR extraction
- [ ] Test bulk upload feature

### Security Steps
- [ ] Change all default passwords
- [ ] Enable rate limiting
- [ ] Set up monitoring (Railway provides basic monitoring)
- [ ] Configure backup strategy for Neon

### Optional Enhancements
- [ ] Add custom domain
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add error tracking (Sentry)
- [ ] Enable Vercel Analytics

---

## 🛠️ Useful Commands

### Railway Backend Management
```bash
# View logs
railway logs

# Open dashboard
railway open

# Run commands in production
railway run python manage.py

# Restart service
railway restart
```

### Vercel Frontend Management
```bash
# View deployments
vercel ls

# View logs
vercel logs

# Rollback to previous version
vercel rollback

# Set environment variables
vercel env add REACT_APP_API_URL
```

### Database Management
```bash
# Connect to Neon database
psql <your-neon-connection-string>

# Backup Neon database
pg_dump <connection-string> > backup.sql

# Run migration
python migrate_to_neon.py

# Verify migration
python migrate_to_neon.py verify
```

---

## 🆘 Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure `CORS_ORIGINS` in backend matches your Vercel URL
- Include `https://` in the URL

**2. Database Connection Failed**
- Check Neon connection string includes `?sslmode=require`
- Verify database is not suspended (Neon free tier suspends after inactivity)

**3. OCR Not Working**
- Railway includes Tesseract by default
- Ensure `TESSERACT_CMD=tesseract` is set

**4. File Upload Issues**
- Check `MAX_CONTENT_LENGTH` is set (default: 16MB)
- Verify Railway disk space

**5. Authentication Errors**
- Ensure `JWT_SECRET_KEY` is same across deployments
- Check token expiration settings

---

## 📊 Service Links & Resources

### Deployment Platforms
- **Neon PostgreSQL**: [neon.tech](https://neon.tech)
- **Railway Backend**: [railway.app](https://railway.app)
- **Vercel Frontend**: [vercel.com](https://vercel.com)

### Monitoring
- Railway Dashboard: Check metrics, logs, and usage
- Vercel Dashboard: View analytics and performance
- Neon Dashboard: Monitor database queries and storage

### Free Tier Limits
- **Neon**: 0.5 GB storage, 1 compute unit
- **Railway**: $5 free credits/month
- **Vercel**: 100 GB bandwidth/month

---

## 🎉 Success Metrics

Your deployment is successful when:
1. ✅ Frontend loads at `https://your-app.vercel.app`
2. ✅ API responds at `https://your-backend.railway.app/api`
3. ✅ Database connected and queries working
4. ✅ File uploads and OCR processing work
5. ✅ Authentication and authorization functional
6. ✅ Admin features accessible

---

## 🔐 Security Checklist

Before going live:
- [ ] Generate secure random keys (32+ characters)
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Set production CORS origins
- [ ] Remove debug mode
- [ ] Set up database backups
- [ ] Monitor for suspicious activity

---

## 📝 Quick Deploy Script

Save this as `deploy.sh` (Git Bash) or `deploy.ps1` (PowerShell):

```powershell
# PowerShell deployment script
Write-Host "🚀 Deploying PramanMitra..." -ForegroundColor Green

# Deploy Backend
Set-Location backend
Write-Host "📦 Deploying backend to Railway..." -ForegroundColor Yellow
railway up

# Get backend URL
$backendUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url

# Deploy Frontend
Set-Location ../frontend
Write-Host "📦 Deploying frontend to Vercel..." -ForegroundColor Yellow
$env:REACT_APP_API_URL = "$backendUrl/api"
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "Backend: $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend: Check Vercel dashboard for URL" -ForegroundColor Cyan
```

---

## 📞 Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check Vercel logs: `vercel logs`
3. Verify environment variables are set correctly
4. Ensure database is active (Neon free tier may suspend)
5. Test API endpoints directly using Postman/cURL

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready