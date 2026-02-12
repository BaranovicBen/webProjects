# ⚠️ CONFIGURATION REQUIRED - PLACEHOLDER VALUES

This document lists all values that **YOU MUST CONFIGURE** before deploying the application.

## 🔴 CRITICAL - Must Fix Before Production

### 1. Backend Encryption Key
**File:** `backend/.env` (create this file)  
**Current:** `default-key-change-in-production-32char`  
**Action Required:**

```bash
# Generate a secure key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Create backend/.env file with:
ENCRYPTION_KEY=<your-generated-key-here>
```

**Why Critical:** All sensitive data is encrypted with this key. Using the default key is a **SEVERE SECURITY RISK**.

---

### 2. Production API URL
**File:** `mobile-app/src/services/api.js:7`  
**Current:** `'https://your-production-api.com/api'`  
**Action Required:**

Replace with your actual backend URL after deployment:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.yourdomain.com/api';  // ← CHANGE THIS
```

**Why Critical:** Mobile app won't connect to backend without correct URL.

---

## 🟡 IMPORTANT - Fix Added Missing Dependency

### 3. expo-clipboard Package
**Status:** ✅ **FIXED** - Added to package.json  
**Version:** `~7.0.0`  
**Action Required:**

```bash
cd group-scheduler/mobile-app
npm install
```

This dependency was missing and would have caused crashes when copying session details.

---

## 🟢 OPTIONAL - Development Configuration

### 4. Development API URL (For Physical Device Testing)
**File:** `mobile-app/src/services/api.js:6`  
**Current:** `'http://localhost:3000/api'`  
**Action Optional:**

If testing on a physical device (not emulator), change to your computer's IP:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api'  // ← Your IP here
  : 'https://your-production-api.com/api';
```

Find your IP:
- **macOS/Linux:** `ifconfig | grep "inet "`
- **Windows:** `ipconfig`

---

## 📋 Quick Checklist

### Before First Run (Development)
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install mobile app dependencies: `cd mobile-app && npm install`
- [ ] Start backend: `cd backend && npm start`
- [ ] Start mobile app: `cd mobile-app && npx expo start`

### Before Production Deployment
- [ ] Generate and set ENCRYPTION_KEY in backend/.env
- [ ] Deploy backend to hosting service
- [ ] Note backend production URL
- [ ] Update API_BASE_URL in mobile-app/src/services/api.js
- [ ] Set NODE_ENV=production in backend
- [ ] Configure HTTPS for backend
- [ ] Build mobile app: `npx expo build`

---

## 📚 Full Documentation

For complete details, see:
- `COMPREHENSIVE_AUDIT_REPORT.md` - Full audit with all findings
- `README.md` - Setup and architecture overview
- `QUICK_START.md` - Quick setup guide
- `DEMO_SCRIPT.md` - Testing and demo instructions

---

**Last Updated:** 2026-02-12  
**Status:** Ready for configuration
