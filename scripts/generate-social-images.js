const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateSocialImages() {
  const svgPath = path.join(__dirname, '../public/logo_dark.svg');
  const publicDir = path.join(__dirname, '../public');
  
  if (!fs.existsSync(svgPath)) {
    console.error('SVG file not found:', svgPath);
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);
  
  console.log('Generating social media preview images...');
  
  // Open Graph image (1200x630)
  const ogWidth = 1200;
  const ogHeight = 630;
  const logoSize = 200;
  
  await sharp({
    create: {
      width: ogWidth,
      height: ogHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
    }
  })
  .composite([
    {
      input: await sharp(svgBuffer).resize(logoSize, logoSize).png().toBuffer(),
      left: Math.floor((ogWidth - logoSize) / 2),
      top: Math.floor((ogHeight - logoSize) / 2),
    }
  ])
  .png()
  .toFile(path.join(publicDir, 'og-image.png'));
  
  console.log('✓ og-image.png (1200x630)');
  
  // Twitter Card image (1200x600)
  await sharp({
    create: {
      width: 1200,
      height: 600,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(svgBuffer).resize(logoSize, logoSize).png().toBuffer(),
      left: Math.floor((1200 - logoSize) / 2),
      top: Math.floor((600 - logoSize) / 2),
    }
  ])
  .png()
  .toFile(path.join(publicDir, 'twitter-image.png'));
  
  console.log('✓ twitter-image.png (1200x600)');
  
  console.log('\nSocial media images generated successfully!');
}

generateSocialImages().catch(console.error);
