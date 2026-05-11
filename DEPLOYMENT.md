# Deployment Guide - Safety Router App

## Live Deployment Options

### **Option 1: Vercel (Recommended - Easiest)**

Vercel is perfect for Vite/React apps with serverless backend support.

#### Steps:
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```
   - Vercel will automatically detect Vite
   - Build and deploy in <2 minutes
   - You'll get a live URL like: `https://safety-router-app.vercel.app`

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Add:
     ```
     AWS_REGION=us-west-2
     AWS_ACCESS_KEY_ID=your_key
     AWS_SECRET_ACCESS_KEY=your_secret
     AWS_S3_CRIMES_BUCKET=kags-crime-data-dev
     AWS_S3_CRIMES_PREFIX=crime-data
     ```

5. **Access on Phone:**
   - Open the deployed URL on your phone
   - Install as PWA: Menu → Install App
   - Works offline with cached data

---

### **Option 2: Netlify (Alternative)**

#### Steps:
1. **Connect GitHub:**
   - Go to: https://netlify.com
   - Click "New site from Git"
   - Select GitHub repo: `KrMatso34/crime-hotspot-analyzer`
   - Branch: `dev`

2. **Configure Build:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click Deploy

3. **Set Environment Variables:**
   - Settings → Build & Deploy → Environment
   - Add AWS credentials same as above

4. **Get Live URL:**
   - Netlify assigns a unique URL
   - Customize domain in settings

---

### **Option 3: AWS Amplify (Most Control)**

Best if you want everything in AWS ecosystem.

#### Steps:
1. **Connect GitHub to Amplify:**
   - Go to: https://console.aws.amazon.com/amplify
   - Select repo: `crime-hotspot-analyzer`
   - Branch: `dev`

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Output: `dist`

3. **Set AWS Credentials:**
   - Amplify dashboard → Environment variables
   - Add all AWS_* variables

4. **Deploy:**
   - Click Deploy
   - Get live URL in minutes

---

### **Option 4: Railway (Simple & Free)**

Fast deployment for Node.js + React apps.

#### Steps:
1. Go to: https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway auto-detects Node.js setup
5. Add environment variables in Railway dashboard
6. Deploy automatically

---

## Recommended: Vercel (Best UX)

### Quick 5-Minute Setup:

```bash
# 1. Login
vercel login

# 2. Deploy
vercel --prod

# 3. Set environment variables in Vercel dashboard
# Your app is live!
```

### Your app will be available at:
```
https://your-project.vercel.app
```

### On your phone:
1. Open URL in browser
2. Tap menu → "Install app"
3. App icon appears on home screen
4. Full PWA with offline support!

---

## GitHub Auto-Deployment (Recommended)

After initial deployment, enable continuous deployment:

**For Vercel:**
- Connect GitHub automatically
- Every push to `dev` auto-deploys
- Preview deployments for pull requests

**Setup:**
1. Deploy once with `vercel --prod`
2. Vercel links your GitHub repo
3. All future `git push` auto-deploys

---

## Testing Locally Before Deploying

```bash
# Build production version
npm run build

# Preview production build locally
npm run preview

# Open http://localhost:4173 on phone using:
# - Router IP: 192.168.x.x:4173
# - ngrok tunnel: ngrok http 4173
```

---

## Mobile Testing Before Going Live

### Option A: ngrok (Quick Tunnel)
```bash
npm install -g ngrok

# In one terminal:
npm run dev

# In another:
ngrok http 5174

# Share ngrok URL with others
```

### Option B: Your WiFi Network
```bash
# Get your machine IP:
ifconfig | grep "inet " | grep -v "127.0.0.1"

# Access from phone on same WiFi:
http://<your-ip>:5174
```

---

## Production Checklist

- [ ] AWS credentials configured as environment variables
- [ ] S3 bucket access working
- [ ] App builds without errors (`npm run build`)
- [ ] Service worker caches properly
- [ ] Map displays crime hotspots
- [ ] Risk scoring calculates correctly
- [ ] Works on mobile (tested)
- [ ] Can be installed as PWA
- [ ] Offline mode functional

---

## After Going Live

1. **Share URL:** Send deployed link to anyone
2. **Mobile Install:** Users can install PWA directly
3. **Auto-Updates:** Vercel redeploys on `git push`
4. **Monitoring:** Check deployment logs for errors
5. **Analytics:** Track usage in deployment dashboard

---

## Troubleshooting

### If S3 data not loading:
- Check environment variables are set
- Verify AWS credentials are correct
- Check IAM permissions for S3 bucket access
- See server logs in deployment dashboard

### If map not showing:
- Verify Leaflet CSS is loaded
- Check browser console for errors
- Confirm GeoJSON data is valid

### If PWA not installing:
- Ensure HTTPS (all cloud platforms provide this)
- Check manifest.json is accessible
- Verify service-worker.js loads

---

## Next Steps

1. **Choose deployment platform** (Vercel recommended)
2. **Deploy in 5 minutes** with step above
3. **Share live URL** with team
4. **Test on phone** before sharing publicly
5. **Enable auto-deployment** from GitHub

Your app will be live and accessible worldwide! 🌍
