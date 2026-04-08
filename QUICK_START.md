# CertifyPro - Quick Start Guide

## 🚀 Run in 3 Steps

### Step 1: Install Dependencies
```bash
cd /vercel/share/v0-project
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
```
http://localhost:3000
```

✅ **Application is now running!**

---

## 🔐 Login Credentials (Default)

After database seed runs:

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`
- Admin Code for Registration: `Swapnil`

**User Account:**
- Email: `user@example.com`
- Password: `password123`

---

## 🎯 Feature Quick Links

Once logged in as admin:

### 1. Generate Certificates with QR Codes
**Path**: `/admin/generate`
- Select candidate
- Choose template
- Generate PDF with QR code

### 2. Verify Certificates (with QR Scanner)
**Path**: `/verify`
- Use "Search" tab: Enter certificate ID
- Use "QR Code" tab: Scan with camera
- View verification with QR code display

### 3. Deliver Certificates (Email/SMS/Download)
**Path**: `/admin/certificates`
- Click "Deliver Certificates"
- Select delivery method
- Track delivery status

### 4. Create/Edit Templates
**Path**: `/admin/templates`
- Click "Create Template" for new
- Click "Edit Template" on existing
- Customize colors, fonts, signatures

### 5. Manage Candidates
**Path**: `/admin/candidates`
- View certificate count per candidate
- Re-generate for same candidate (unlimited)
- Track generation history

---

## 📋 Features Overview

| Feature | Status | Link |
|---------|--------|------|
| QR Code Generation | ✅ Complete | `/admin/generate` |
| QR Code Scanning | ✅ Complete | `/verify` |
| Certificate Verification | ✅ Complete | `/verify` |
| Reusable Candidates | ✅ Complete | `/admin/generate` |
| Email Delivery | ✅ Complete (Mock) | `/admin/certificates` |
| SMS Delivery | ✅ Complete (Mock) | `/admin/certificates` |
| ZIP Download | ✅ Complete | `/admin/certificates` |
| Template Editor | ✅ Complete | `/admin/templates/edit` |
| Digital Signatures | ✅ Complete | `/admin/templates/edit` |
| Custom Fields | ✅ Complete | `/admin/templates/edit` |

---

## 🧪 5-Minute Test

1. **Login** (`/login`)
   - Use admin credentials above

2. **Add Candidate** (`/admin/candidates`)
   - New candidate: "Test User"

3. **Generate Certificate** (`/admin/generate`)
   - Select candidate
   - Select template
   - Click Generate

4. **Verify Certificate** (`/verify`)
   - Copy certificate ID from previous step
   - Search for it OR
   - Switch to QR tab and scan

5. **Deliver Certificate** (`/admin/certificates`)
   - Click "Deliver Certificates"
   - Select "Download ZIP"
   - Download file

✅ **All features tested in 5 minutes!**

---

## 🎨 Customization Examples

### Change Admin Code
Edit `/app/api/auth/register/route.ts`:
```typescript
const SUPER_ADMIN_CODE = process.env.ADMIN_SECRET_CODE || "YOUR_CODE_HERE"
```

### Add More Templates
1. Go to `/admin/templates`
2. Click "Create Template"
3. Fill details and save
4. Use when generating

### Customize Colors
Edit `/app/globals.css`:
```css
@theme {
  --color-primary: #1e3a5f;
  --color-accent: #c8a45a;
  /* ... other colors ... */
}
```

---

## 📱 Browser Support

| Browser | QR Scanner | Downloads | Forms | Status |
|---------|-----------|-----------|-------|--------|
| Chrome | ✅ | ✅ | ✅ | Fully Supported |
| Firefox | ✅ | ✅ | ✅ | Fully Supported |
| Safari | ✅ | ✅ | ✅ | Fully Supported |
| Edge | ✅ | ✅ | ✅ | Fully Supported |
| Mobile | ✅ | ✅ | ✅ | Fully Supported |

---

## ⚙️ Environment Setup (Optional)

Create `.env.local` file:

```env
# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# Admin Secret Code (Optional - defaults to "Swapnil")
ADMIN_SECRET_CODE=YOUR_SECRET_CODE

# Node Environment (Optional)
NODE_ENV=development
```

---

## 🆘 Troubleshooting

### Issue: "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Issue: "MongoDB connection failed"
- Check `.env.local` has correct MONGODB_URI
- Verify IP whitelist in MongoDB Atlas
- Ensure internet connection is stable

### Issue: "QR Scanner not working"
- Check browser camera permissions
- Try different browser
- Clear browser cache and reload
- Check browser console (F12) for errors

### Issue: "Registration failed"
- Check console (F12) for error message
- Verify all required fields filled
- Ensure email not already registered
- Check admin code if registering as admin

### Issue: "Styles not loading"
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📚 Full Documentation

For detailed information, see:
- **IMPLEMENTATION_SUMMARY.md** - Complete feature breakdown
- **FEATURES_GUIDE.md** - In-depth feature documentation
- **SETUP_CHECKLIST.md** - Complete verification checklist

---

## 🔗 Important URLs

### Public Pages
- Home: `http://localhost:3000`
- Verify Certificate: `http://localhost:3000/verify`
- Login: `http://localhost:3000/login`
- Register: `http://localhost:3000/register`

### Admin Pages (Login Required)
- Dashboard: `http://localhost:3000/admin`
- Candidates: `http://localhost:3000/admin/candidates`
- Certificates: `http://localhost:3000/admin/certificates`
- Generate: `http://localhost:3000/admin/generate`
- Templates: `http://localhost:3000/admin/templates`
- Template Editor: `http://localhost:3000/admin/templates/edit`

### User Pages (Login Required)
- User Dashboard: `http://localhost:3000/dashboard`
- My Certificates: `http://localhost:3000/dashboard/certificates`
- Profile: `http://localhost:3000/dashboard/profile`

---

## 💡 Pro Tips

1. **QR Scanning**: 
   - Allow camera access when prompted
   - Point camera at QR code from certificate
   - Auto-detects and navigates to verification

2. **Batch Operations**:
   - Generate multiple certificates at once
   - Deliver to multiple recipients at once
   - Modify multiple templates in templates section

3. **Template Reuse**:
   - Create templates once, use many times
   - Edit template to update all future certificates
   - Keep a "Standard" template as default

4. **Testing**:
   - Use test email: `test@example.com`
   - Use test phone: `+1-555-0000`
   - Check console (F12) for mock service logs

5. **Performance**:
   - Generate in batches of 10-20 for speed
   - Clear browser cache if slow
   - Use Chrome for best performance

---

## 🎓 Learning Resources

- **MongoDB**: https://docs.mongodb.com
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Shadcn/UI**: https://ui.shadcn.com

---

## 📊 Database Collections

After running with MongoDB:
- `users` - Admin and user accounts
- `candidates` - Event participants
- `certificates` - Generated certificates
- `templates` - Certificate templates
- `notifications` - Delivery logs
- `admincodes` - Organization admin codes

---

## 🚀 Next Steps

1. ✅ Run `npm run dev`
2. ✅ Visit `http://localhost:3000`
3. ✅ Login with admin credentials
4. ✅ Test features as outlined above
5. 📧 For production: Set up real email service
6. 📱 For SMS: Configure Twilio/AWS SNS
7. ☁️ For storage: Setup Vercel Blob/S3
8. 📊 For monitoring: Add Sentry/PostHog

---

## ✨ You're All Set!

Everything is configured and ready to use.

**Happy Certificate Management! 🎉**

---

**Questions?** Check the troubleshooting section or see detailed docs.

