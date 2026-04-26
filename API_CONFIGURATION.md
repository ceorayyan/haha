# API Configuration Guide

## Overview

The frontend is configured to support multiple backend API URLs with automatic fallback. If one API server is unavailable, the system will automatically try the next available server.

## Supported API URLs

The application supports the following backend URLs (in order of priority):

1. **Environment Variable** (Primary): `NEXT_PUBLIC_API_URL` from `.env` files
2. **Laravel Cloud** (Fallback 1): `https://backend-of-research-nexus-ai.free.laravel.cloud/api`
3. **Production API** (Fallback 2): `https://api.statanex.com/api`

## Environment Files

### Development (`.env.local` or `.env.development`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Production (`.env.production`)
```env
NEXT_PUBLIC_API_URL=https://backend-of-research-nexus-ai.free.laravel.cloud/api
```

## How It Works

1. **Primary URL**: The application first tries the URL specified in `NEXT_PUBLIC_API_URL`
2. **Automatic Fallback**: If the primary URL fails (network error), it automatically tries the next URL
3. **URL Persistence**: The last successful URL is stored in `localStorage` for faster subsequent requests
4. **Manual Override**: Users can manually switch between API servers if needed

## Fallback Behavior

- **Network Errors**: Automatically tries the next URL
- **Authentication Errors (401)**: Does not trigger fallback (redirects to login)
- **Permission Errors (403)**: Does not trigger fallback (shows error)
- **Other HTTP Errors**: Does not trigger fallback (shows error)

## API Client Methods

### Get Current Base URL
```typescript
import api from '@/lib/api';

const currentUrl = api.getCurrentBaseUrl();
console.log('Current API URL:', currentUrl);
```

### Get All Available URLs
```typescript
const availableUrls = api.getAvailableUrls();
console.log('Available URLs:', availableUrls);
```

### Manually Set Base URL
```typescript
api.setBaseUrl('https://api.statanex.com/api');
```

## Testing Different Environments

### Local Development
```bash
# Use localhost backend
npm run dev
```

### Production Build
```bash
# Build with production API
npm run build
npm start
```

### Testing Fallback
To test the fallback mechanism:
1. Start with a valid API URL
2. Stop the backend server
3. Make an API request
4. The system will automatically try the next available URL

## Troubleshooting

### Issue: "Unable to connect to any server"
**Solution**: 
- Check your internet connection
- Verify at least one backend server is running
- Check browser console for detailed error messages

### Issue: API requests are slow
**Solution**:
- The first request after a server failure may be slow due to fallback attempts
- Subsequent requests will use the cached working URL

### Issue: Wrong API URL being used
**Solution**:
- Clear localStorage: `localStorage.removeItem('api_base_url')`
- Or manually set the URL: `api.setBaseUrl('your-preferred-url')`

## Configuration Files

- `frontend/lib/api.ts` - Main API client with fallback logic
- `frontend/.env.local` - Local development configuration
- `frontend/.env.production` - Production configuration
- `frontend/.env.production.example` - Production configuration template

## Security Notes

- All production URLs should use HTTPS
- API tokens are stored in localStorage
- Tokens are automatically included in authenticated requests
- Tokens are cleared on 401 (Unauthorized) responses
