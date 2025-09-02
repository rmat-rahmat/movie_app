const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateFavicons() {
  const svgPath = path.join(__dirname, '../public/logo_dark.svg');
  const publicDir = path.join(__dirname, '../public');
  
  // Ensure the SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error('SVG file not found:', svgPath);
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);
  
  // Generate different sizes for favicon
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  
  console.log('Generating favicon files...');
  
  // Generate PNG files for different sizes
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `favicon-${size}x${size}.png`));
    console.log(`✓ favicon-${size}x${size}.png`);
  }
  
  // Generate Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');
  
  // Generate Android Chrome icons
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  console.log('✓ android-chrome-192x192.png');
    
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  console.log('✓ android-chrome-512x512.png');
  
  // Generate main favicon.ico (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png');
  
  // Copy the original SVG as favicon.svg
  fs.copyFileSync(svgPath, path.join(publicDir, 'favicon.svg'));
  console.log('✓ favicon.svg');
  
  console.log('\nAll favicon files generated successfully!');
  console.log('Note: For favicon.ico, you may want to use an online converter or imagemagick');
}

generateFavicons().catch(console.error);
