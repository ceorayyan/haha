# Debug: Page Reloading Issue

## Possible Causes

1. **useBranding Hook Re-rendering**
   - Hook might be triggering multiple re-renders
   - Fixed by adding `useRef` and proper cleanup

2. **API Fallback Mechanism**
   - API client tries multiple URLs on failure
   - Each attempt might trigger a re-render

3. **React Strict Mode**
   - In development, React runs effects twice
   - This is normal behavior and won't happen in production

## How to Debug

### 1. Check Browser Console
Open DevTools (F12) and look for:
- Multiple "Branding fetch timeout" messages
- Multiple API requests to `/api/settings`
- Any error messages

### 2. Check Network Tab
- See how many requests are being made
- Check if requests are failing and retrying

### 3. Disable React Strict Mode (Temporary)
Edit `frontend/app/layout.tsx` and check if `<React.StrictMode>` is wrapping the app.

## Quick Fixes Applied

### 1. Optimized useBranding Hook
```typescript
// Added:
- useRef to track mounted state
- isFetching flag to prevent duplicate fetches
- Proper cleanup on unmount
- Empty dependency array to run effect only once
```

### 2. Removed Blocking Loading State
```typescript
// Login page now shows immediately
// No waiting for branding to load
```

## Testing Steps

1. **Clear Browser Cache**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Close and reopen browser

2. **Hard Refresh**
   - Press Ctrl+Shift+R (Windows)
   - Or Cmd+Shift+R (Mac)

3. **Check Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for repeated messages

4. **Monitor Network**
   - Go to Network tab
   - Filter by "Fetch/XHR"
   - See how many requests to `/api/settings`

## Expected Behavior

### Development Mode
- Page may reload 1-2 times (React Strict Mode)
- Should see 1 request to `/api/settings`
- Page should load in < 3 seconds

### Production Mode
- Page should load once
- Single request to `/api/settings`
- Instant page load with defaults

## If Still Reloading

### Option 1: Disable API Fallback Temporarily
Edit `frontend/lib/api.ts`:
```typescript
const API_URLS = [
  'http://localhost:8000/api', // Only use localhost
];
```

### Option 2: Use Static Branding
Edit `frontend/hooks/useBranding.ts`:
```typescript
// Comment out the API call
// Just return DEFAULT_BRANDING
return { branding: DEFAULT_BRANDING, loading: false };
```

### Option 3: Check for Redirect Loops
Look for any `router.push()` calls that might be causing loops.

## Files to Check

1. `frontend/hooks/useBranding.ts` - Branding fetch logic
2. `frontend/lib/api.ts` - API client with fallback
3. `frontend/app/login/page.tsx` - Login page
4. `frontend/app/layout.tsx` - Root layout
5. `frontend/app/components/ProtectedRoute.tsx` - Auth guard

## Production Build Test

To test without React Strict Mode:
```bash
cd frontend
npm run build
npm start
```

Then visit: http://localhost:3000/login

This will show the actual production behavior without development-mode double-rendering.
