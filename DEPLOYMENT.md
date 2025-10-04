# 🚀 Render Deployment Guide

## Quick Deploy Steps

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub, GitLab, or Bitbucket:

```bash
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Sign Up on Render

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub/GitLab/Bitbucket
3. Authorize Render to access your repositories

### 3. Create New Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your repository
3. Configure the following:

**Basic Settings:**
- **Name**: `ms-special-ecommerce` (or your choice)
- **Branch**: `main`
- **Root Directory**: `.` (leave empty)
- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Publish Directory**: `dist`

### 4. Add Environment Variables

In the Render dashboard, go to **Environment** tab and add all these variables:

```
VITE_FIREBASE_API_KEY = your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN = your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = your_project_id
VITE_FIREBASE_STORAGE_BUCKET = your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
VITE_FIREBASE_APP_ID = your_app_id
VITE_FIREBASE_DATABASE_URL = https://your_project.firebaseio.com
VITE_PAYSTACK_PUBLIC_KEY = pk_test_xxxxxxxxxxxxx
VITE_STORE_PHONE = +233 24 298 8277
VITE_STORE_LOCATION = Okaishei - Accra
VITE_STORE_EMAIL = msfoods.gh@gmail.com
```

**Important:** Replace all placeholder values with your actual credentials from Firebase and Paystack.

### 5. Deploy

1. Click **"Create Static Site"**
2. Render will automatically build and deploy your app
3. Wait for deployment to complete (5-10 minutes)
4. Your site will be live at: `https://your-app-name.onrender.com`

### 6. Custom Domain (Optional)

1. Go to **Settings** → **Custom Domains**
2. Add your domain (e.g., `www.msspecial.com`)
3. Update DNS records as instructed by Render
4. SSL certificate is automatically provided

---

## Automatic Deployments

Render automatically deploys when you push to your connected branch:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Render will automatically rebuild and deploy
```

---

## Troubleshooting

### Build Fails with Dependency Errors
**Solution:** The build command includes `--legacy-peer-deps` flag to handle React 19 peer dependency issues.

### Environment Variables Not Working
**Solution:** 
1. Ensure all env vars start with `VITE_`
2. Rebuild the app after adding env vars
3. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

### 404 Errors on Refresh
**Solution:** The `_redirects` file in `public/` folder handles SPA routing. Ensure it exists:
```
/*    /index.html   200
```

### App Shows Blank Page
**Solution:**
1. Check browser console for errors
2. Verify Firebase credentials are correct
3. Check Render build logs for errors
4. Ensure `dist` folder is being created

---

## Build Optimization

For faster builds and smaller bundle size:

1. **Analyze Bundle Size:**
```bash
npm run build
# Check dist/ folder size
```

2. **Optimize Images:**
- Use compressed images (max 500KB per product image)
- Base64 encoding already optimized for Firebase

3. **Cache Configuration:**
Render automatically caches `node_modules` between builds.

---

## Monitoring

1. **Build Logs:** Available in Render dashboard
2. **Deploy Events:** Email notifications on deploy success/failure
3. **Analytics:** Use Firebase Analytics for user tracking

---

## Cost

- **Free Tier:** 
  - 100 GB bandwidth/month
  - Global CDN
  - Automatic SSL
  - Custom domains
  - Perfect for this project!

- **Paid Tier:** Only if you exceed free limits

---

## Production Checklist

Before going live:

- [ ] All environment variables set in Render
- [ ] Firebase security rules updated (see README.md)
- [ ] Paystack in live mode (update public key)
- [ ] Admin user created in Firebase
- [ ] Default categories added
- [ ] Test complete purchase flow
- [ ] Custom domain configured (optional)
- [ ] Firebase billing enabled (if using phone auth)
- [ ] Error monitoring setup (optional: Sentry)

---

## Support

If you encounter issues:

1. Check Render build logs
2. Review browser console errors
3. Verify Firebase/Paystack credentials
4. Contact: msfoods.gh@gmail.com

---

**Your app will be live at:** `https://ms-special-ecommerce.onrender.com`

🎉 **Happy Deploying!**
