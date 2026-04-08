# MongoDB Atlas Setup Guide

## 🎯 Your Connection String
```
MONGODB_URI=mongodb+srv://khandekarswapnil423_db_user:Swapnil@cluster0.wsny3by.mongodb.net/?appName=Cluster0
```
✅ This is already in your `.env.local`

---

## ❌ Current Problem
Your ISP/Firewall is blocking DNS resolution for MongoDB SRV queries.

---

## ✅ Solutions to Use MongoDB Atlas

### **Solution 1: Change Windows DNS (Recommended - Free)**

This is the easiest fix. Windows is using your ISP's DNS which blocks MongoDB.

#### Steps:

1. **Press:** `Windows Key + R`
2. **Type:** `ncpa.cpl` and press Enter
3. **Right-click** your active connection → **Properties**
4. **Find and double-click:** "Internet Protocol Version 4 (TCP/IPv4)"
5. **Select:** "Use the following DNS server addresses"
6. **Enter:**
   - Preferred DNS: `1.1.1.1` (Cloudflare - recommended)
   - Alternate DNS: `8.8.8.8` (Google)
7. **Click OK** → **Close**
8. **Restart your terminal/dev server**

Then run:
```powershell
npm run dev
```

---

### **Solution 2: Use VPN (Alternative)**

If changing DNS doesn't work, try a VPN:

1. Download VPN (Free options: Hotspot Shield, ProtonVPN, WindscribeVPN)
2. Connect to VPN
3. Run: `npm run dev`
4. Test login/registration

**Why this works:** VPN bypasses ISP blocking

---

### **Solution 3: MongoDB Atlas - Direct Connection String**

If above don't work, try this connection format in `.env.local`:

```env
MONGODB_URI=mongodb+srv://khandekarswapnil423_db_user:Swapnil@cluster0.wsny3by.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority
```

Or with different DNS resolver:
```env
MONGODB_URI=mongodb+srv://khandekarswapnil423_db_user:Swapnil@cluster0.wsny3by.mongodb.net/?serverSelectionTimeoutMS=10000&appName=Cluster0
```

---

### **Solution 4: Verify MongoDB Atlas is Active**

1. Go to: https://www.mongodb.com/cloud/atlas
2. Login with: `khandekarswapnil423@gmail.com`
3. Check if "cluster0" is **Green/Running** (not Paused)
4. If Paused, click **Resume**

---

### **Solution 5: Contact MongoDB Support**

If none above work:
1. Go to MongoDB Atlas dashboard
2. Click **Help** → **Support**
3. Create ticket with error: `querySrv ECONNREFUSED`
4. Include your IP address and location

---

## 🚀 After Fixing - Test It

Run these commands:

```powershell
# Clear cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Start server
npm run dev
```

Then:
1. Go to: **http://localhost:3000/register**
2. Register a test account
3. Try to login

---

## ✅ Quick Checklist

- [ ] Changed DNS to 1.1.1.1 or 8.8.8.8
- [ ] Restarted dev server (`npm run dev`)
- [ ] .env.local has correct MONGODB_URI
- [ ] MongoDB Atlas cluster0 is Running (not Paused)
- [ ] Internet is working (ping 8.8.8.8)

---

## 📝 If You Get Error: "Invalid email or password"

This means MongoDB is working! Try:
1. Register a NEW account first
2. Then login with those credentials

Default admin:
- Email: admin@certifypro.com  
- Password: Swapnil@123
- Admin Code: `Swapnil`

