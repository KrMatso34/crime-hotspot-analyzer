# PWA Configuration Guide

This project is configured as a Progressive Web App (PWA) for a better mobile experience.

## Features

### ✅ What's Enabled
- **Offline Support**: Service Worker caches static assets and API responses
- **Install to Home Screen**: Install as a native-like app on mobile devices
- **Push Notifications**: (Can be enabled for alerts and updates)
- **Background Sync**: (Ready for offline route requests)
- **Responsive Design**: Works on all device sizes

### 📱 Installation

#### On Mobile (Android/iOS)
1. Open the app in your browser
2. Look for "Install" or "Add to Home Screen" prompt
3. Tap to install - app will appear as a native app

#### On Desktop
- Chrome/Edge: Click the install icon in the address bar
- Safari: Use "Add to Home Screen" from share menu

## Service Worker

The service worker (`public/service-worker.js`) handles:
- **Caching Strategy**: 
  - Static assets: Cache-first (serve from cache, fallback to network)
  - API calls: Network-first (try network, fallback to cache)
- **Update Detection**: Auto-detects new versions
- **Offline Fallback**: Shows offline page when disconnected

## Manifest Configuration

The `public/manifest.json` defines:
- App name, description, and icons
- Display mode: Standalone (looks like native app)
- Theme colors
- App shortcuts
- Screenshots for app stores

## Build & Deploy

### Development
```bash
npm run dev
```
Service Worker only registers in production builds.

### Production Build
```bash
npm run build
npm run preview
```

For production deployment:
1. Build the app: `npm run build`
2. Serve with HTTPS (required for PWA)
3. Test installation on mobile devices
4. Consider submitting to app stores (optional)

## Adding App Icons

To make the app installable with custom icons, add PNG files to `public/icons/`:
- `icon-192x192.png` (required)
- `icon-512x512.png` (required)
- `icon-192x192-maskable.png` (optional, for adaptive icons)
- `icon-512x512-maskable.png` (optional)

**Tool for icon generation**: [PWA Image Generator](https://www.pwabuilder.com/)

## Testing PWA Features

### Chrome DevTools
1. Open DevTools → Applications tab
2. Check Service Workers, Cache Storage, Manifest sections

### Test Offline
1. Open app in DevTools
2. Network tab → check "Offline"
3. App should remain functional with cached data

### Test Installation
1. Open in Chrome mobile
2. Tap menu → "Install app" or wait for install prompt
3. App appears on home screen

## Troubleshooting

### Service Worker Not Registering
- Make sure you're on HTTPS (or localhost)
- Check browser console for errors
- Clear site data and reload

### Cache Not Working
- Check Service Worker status in DevTools
- Clear Application Cache in DevTools
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Icons Not Showing
- Verify icon files exist in `public/icons/`
- Check manifest.json icon paths
- Use appropriate image format (PNG recommended)

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWABuilder](https://www.pwabuilder.com/)
