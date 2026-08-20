import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compressReceiptImage, scanCompressedReceipt } from './scan';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '.env') });

const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: true }));
app.use(express.json({ limit: '20mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/scan', async (req, res) => {
  const imageBase64 =
    typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64.replace(/\s/g, '') : '';
  const mimeType =
    typeof req.body?.mimeType === 'string' && req.body.mimeType.startsWith('image/')
      ? req.body.mimeType
      : 'image/jpeg';

  if (!imageBase64) {
    res.status(400).json({ error: 'Upload a receipt photo to scan.' });
    return;
  }

  try {
    let compressed;
    try {
      compressed = await compressReceiptImage(imageBase64);
      console.log(
        `Compressed receipt ${Buffer.byteLength(imageBase64, 'base64')} -> ${Buffer.byteLength(compressed.base64, 'base64')} bytes`,
      );
    } catch (error) {
      console.warn('Could not compress receipt image; sending original.', error);
      compressed = { base64: imageBase64, mimeType };
    }

    const receipt = await scanCompressedReceipt(compressed.base64, compressed.mimeType);
    res.json(receipt);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Receipt scan failed.';
    const status = /not configured|invalid gemini api key|expired/i.test(message) ? 500 : 422;
    console.error(message);
    res.status(status).json({ error: message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Receipt scan API listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY && !process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    console.warn('No GEMINI_API_KEY found. Add it to .env before scanning receipts.');
  }
});
