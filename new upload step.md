# Favicon and Social Media Metadata Setup

## Overview
This document outlines the favicon and social media metadata setup for OTalk.TV using the `logo_light.svg` as the base logo.

## Generated Files

### Favicon Files
All favicon files are generated from `/public/logo_light.svg`:

- `favicon.svg` - Modern SVG favicon (scalable)
- `favicon-16x16.png` - Small favicon
- `favicon-32x32.png` - Standard favicon
- `favicon-48x48.png` - Medium favicon
- `favicon-64x64.png` - Large favicon
- `favicon-128x128.png` - Retina favicon
- `favicon-256x256.png` - High-res favicon
- `favicon-512x512.png` - Ultra high-res favicon
- `apple-touch-icon.png` - Apple devices (180x180)
- `android-chrome-192x192.png` - Android devices
- `android-chrome-512x512.png` - Android devices (high-res)

### Social Media Images
- `og-image.png` - Open Graph image (1200x630) for Facebook, LinkedIn
- `twitter-image.png` - Twitter Card image (1200x600)

### Web App Manifest
- `manifest.json` - PWA manifest for app installation

## Metadata Configuration

### Open Graph (Facebook, LinkedIn, WhatsApp)
- **Title**: "OTalk.TV - Watch Movies & TV Shows"
- **Description**: "Watch your favorite movies and TV shows on OTalk.TV - Your ultimate streaming destination"
- **Image**: `/og-image.png` (1200x630)
- **Type**: website
- **Locale**: en_US

### Twitter Cards
- **Card Type**: summary_large_image
- **Title**: "OTalk.TV - Watch Movies & TV Shows"
- **Description**: Same as Open Graph
- **Image**: `/twitter-image.png` (1200x600)

### SEO Metadata
- **Title Template**: "%s | OTalk.TV"
- **Keywords**: movies, tv shows, streaming, entertainment, watch online
- **Theme Color**: #FBAF32 (brand orange)
- **Canonical URL**: https://otalk.tv

## Scripts

### Regenerate Icons
```bash
npm run generate:icons
```
This runs both favicon and social image generation scripts.

### Individual Scripts
```bash
# Generate favicons only
node scripts/generate-favicon.js

# Generate social media images only
node scripts/generate-social-images.js
```

## Browser Support

### Favicon Support
- **Modern browsers**: SVG favicon (`favicon.svg`)
- **Legacy browsers**: PNG fallbacks (16x16, 32x32)
- **Apple devices**: Apple Touch Icon (180x180)
- **Android devices**: Android Chrome icons (192x192, 512x512)

### PWA Support
- Web App Manifest for "Add to Home Screen" functionality
- Theme color integration
- Standalone display mode

## Testing

### Favicon Testing
1. Check browser tab for favicon
2. Test bookmark appearance
3. Verify mobile home screen icon

### Social Media Testing
Use these tools to test social sharing:
- **Facebook**: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter**: [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **LinkedIn**: Share a post and check preview
- **WhatsApp**: Send a link and check preview

### SEO Testing
- **Google Rich Results**: [Rich Results Test](https://search.google.com/test/rich-results)
- **Structured Data**: [Schema Markup Validator](https://validator.schema.org/)

## Customization

### Updating the Logo
1. Replace `/public/logo_light.svg` with new logo
2. Run `npm run generate:icons` to regenerate all assets
3. Update brand colors in:
   - `manifest.json` (theme_color)
   - `layout.tsx` (meta theme-color)

### Updating Metadata
Edit the metadata object in `/src/app/layout.tsx`:
- Change site title, description
- Update social media handles
- Modify Open Graph/Twitter settings
- Add verification codes

### Brand Colors
Current theme color: `#FBAF32` (orange)
- Update in `manifest.json`
- Update in `layout.tsx` meta tags
- Update in social image generation scripts if needed

## Performance Notes
- SVG favicon is preferred for modern browsers (scalable, small file size)
- PNG fallbacks ensure compatibility with older browsers
- Social media images are optimized for sharing platforms
- All images use compression for optimal loading

## Security Considerations
- All metadata uses HTTPS URLs
- No sensitive information in meta tags
- Proper domain verification setup ready for search engines
