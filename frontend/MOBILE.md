# Book It All — website and web app

`frontend/` is the Next.js website and PWA only.

Android and iOS live in `../mobile` (Flutter). Run them with:

```bash
cd ../mobile
flutter run
```

## Website + web app

```bash
cd frontend
npm run dev
```

PWA pieces already in the app:

- `src/app/manifest.ts`
- `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/apple-touch-icon.png`
- service worker at `/sw.js`
- offline page at `/offline.html`

Chrome: install from the address bar. iOS Safari: Share → Add to Home Screen.
