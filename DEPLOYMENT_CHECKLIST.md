# ✅ Pre-Deployment Checklist

## Before Pushing to Git

- [ ] `.env` is in `.gitignore` (DO NOT commit secrets!)
- [ ] All environment variables are documented in `.env.example`
- [ ] Remove any console.logs or debugging code
- [ ] Test build locally: `npm run build`
- [ ] Preview build locally: `npm run preview`
- [ ] All features working in preview mode

## Git Repository Setup

- [ ] Initialize git: `git init`
- [ ] Create `.gitignore` (already done ✓)
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Create GitHub/GitLab repository
- [ ] Add remote: `git remote add origin <url>`
- [ ] Push: `git push -u origin main`

## Firebase Configuration

- [ ] Firebase project created
- [ ] Realtime Database enabled
- [ ] Authentication methods enabled
- [ ] Security rules configured
- [ ] Admin user created
- [ ] At least 3 categories added
- [ ] Test data added (optional)

## Render Setup

- [ ] Render account created
- [ ] Repository connected
- [ ] Static site created
- [ ] Build command set: `npm install --legacy-peer-deps && npm run build`
- [ ] Publish directory set: `dist`

## Environment Variables in Render

Add these in Render Dashboard → Environment:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_DATABASE_URL
VITE_PAYSTACK_PUBLIC_KEY
VITE_STORE_PHONE
VITE_STORE_LOCATION
VITE_STORE_EMAIL
```

- [ ] All environment variables added
- [ ] Values verified (no placeholders)
- [ ] Firebase credentials from live project
- [ ] Paystack key (test or live)

## Post-Deployment Testing

- [ ] Site loads successfully
- [ ] No console errors
- [ ] Can register new user
- [ ] Can login
- [ ] Products page loads
- [ ] Product details page works
- [ ] Can add to cart
- [ ] Cart persists on refresh
- [ ] Checkout page accessible
- [ ] Categories display correctly
- [ ] Images load properly
- [ ] Notifications working
- [ ] Admin dashboard accessible
- [ ] Agent features working

## Production Readiness

- [ ] Firebase security rules updated for production
- [ ] Paystack in live mode (change key)
- [ ] Remove test data
- [ ] Add real product data
- [ ] Test complete purchase flow
- [ ] Set up error monitoring (optional)
- [ ] Configure custom domain (optional)
- [ ] Enable Firebase billing if using phone auth
- [ ] Backup Firebase database

## Performance Optimization

- [ ] Image sizes optimized (< 500KB each)
- [ ] No unnecessary console.logs
- [ ] Build size checked: `npm run build`
- [ ] Lazy loading implemented where needed
- [ ] CDN working (Render provides this)

## Documentation

- [ ] README.md complete
- [ ] DEPLOYMENT.md reviewed
- [ ] DOCUMENTATION.md updated
- [ ] Team members have access
- [ ] Admin credentials documented securely

## Monitoring

- [ ] Firebase Analytics enabled (optional)
- [ ] Render email notifications enabled
- [ ] Error tracking setup (optional)
- [ ] Uptime monitoring (optional)

---

## Quick Deploy Command

```bash
# After completing checklist above:
git add .
git commit -m "Ready for production"
git push origin main

# Render will auto-deploy!
```

---

## Emergency Rollback

If something goes wrong after deployment:

1. Go to Render Dashboard
2. Click on your service
3. Go to "Events" tab
4. Find previous successful deploy
5. Click "Rollback to this deploy"

---

## Support Contacts

- **Firebase**: console.firebase.google.com
- **Render**: dashboard.render.com
- **Paystack**: dashboard.paystack.com
- **Project Email**: msfoods.gh@gmail.com

---

**Last Updated**: Before deployment
**Checked By**: ___________
**Date**: ___________
