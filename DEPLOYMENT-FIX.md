# Authentication Fix Deployment Guide

## Problem Fixed
Admin users were being redirected to login when accessing `/settings` and `/users` pages in the deployed environment (Coolify).

## Key Changes Made

### 1. Middleware Fix (Critical)
**File:** `src/middleware.ts`
- **Changed**: Replaced naive string-based admin check with proper `isAdminFromRequest()` function
- **Impact**: Middleware now correctly validates admin sessions using the authentication library

### 2. Session API Fix (Critical)
**File:** `src/app/api/auth/session/route.ts`
- **Changed**: Returns user data directly instead of health check format
- **Impact**: Client-side UserContext can properly parse authentication state

### 3. Enhanced Authentication Library
**File:** `src/lib/auth.ts`
- **Added**: Environment-aware cookie configuration
- **Added**: Comprehensive logging for debugging
- **Fixed**: Async cookies compatibility for Next.js 15

### 4. Client-Side Protection (Additional Safety)
**Files:** `src/app/settings/page.tsx`, `src/app/users/page.tsx`
- **Added**: Admin role checks and redirects
- **Added**: Loading states while authentication is verified

### 5. Debug Endpoint
**File:** `src/app/api/debug/auth/route.ts`
- **Purpose**: Diagnose authentication issues in production
- **Usage**: Visit `/api/debug/auth` when logged in

## Deployment Steps

### 1. Push Changes to Repository
```bash
git add .
git commit -m "Fix admin authentication for production deployment"
git push origin main
```

### 2. Update Environment Variables in Coolify
Set these in your Coolify deployment environment variables:
```bash
NODE_ENV=production
DISABLE_SECURE_COOKIES=true
COOKIE_DOMAIN=""
NEXTAUTH_SECRET="generate-a-secure-secret-here"
DATABASE_URL="file:./prod.db"
```

### 3. Deploy to Coolify
- Trigger a new deployment through Coolify dashboard
- Or push changes if auto-deployment is enabled

### 4. Test the Fix
1. **Login**: Use admin@pacificpapercups.com / admin123
2. **Debug Check**: Visit `/api/debug/auth` to verify session state
3. **Test Admin Access**: Try accessing `/settings` and `/users`
4. **Check Logs**: Monitor Coolify logs for any authentication errors

## Expected Behavior After Fix

### Login Process
1. Admin logs in successfully
2. Session cookie is set with proper environment-aware settings
3. UserContext receives and stores user data correctly

### Admin Page Access
1. Middleware validates admin session using proper auth functions
2. Client-side guards provide additional protection
3. Admin successfully accesses settings and user management pages

### If Issues Persist

#### Check Debug Endpoint
Visit `/api/debug/auth` while logged in and verify:
- `cookies.session_cookie` has a value
- `auth.user.role` equals "admin"
- `environment.DISABLE_SECURE_COOKIES` is "true"

#### Common Issues & Solutions
- **No session cookie**: Verify DISABLE_SECURE_COOKIES=true in environment
- **Role not admin**: Check if using correct admin email addresses
- **Still redirecting**: Clear browser cookies and try fresh login

#### Log Monitoring
Look for these log entries in Coolify:
- "Admin authentication successful for [email]"
- "Session cookie set with options"
- "Admin access granted"

## Environment Variable Details

### DISABLE_SECURE_COOKIES=true
- **Required for**: Coolify proxy setups without SSL termination
- **Effect**: Allows cookies to work behind HTTP proxies
- **Security**: Still uses httpOnly and proper sameSite settings

### COOKIE_DOMAIN
- **Default**: Leave empty for automatic domain detection
- **Custom**: Set to your domain if using custom domain setup

### NEXTAUTH_SECRET
- **Purpose**: Used for session encryption
- **Generate**: Use a strong, random 32+ character string
- **Important**: Keep consistent across deployments

## Rollback Plan
If deployment fails, the changes are backward compatible. You can:
1. Revert the git commits
2. Redeploy previous version
3. Keep existing environment variables

## Monitoring
After deployment, monitor for:
- Successful admin logins in logs
- Access to /settings and /users pages
- No authentication-related errors in Coolify logs