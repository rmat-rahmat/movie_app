import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      res.status(400).json({ error: 'Missing filename or data' });
      return;
    }
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    // data is expected to be a data URL like data:image/png;base64,....
    const matches = data.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: 'Invalid image data' });
      return;
    }
    const base64 = matches[2];
    const buffer = Buffer.from(base64, 'base64');
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);
    const publicUrl = `/uploads/${filename}`;
    res.status(200).json({ url: publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save image' });
  }
}
