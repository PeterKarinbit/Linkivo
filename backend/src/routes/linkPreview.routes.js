import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

function toAbsoluteUrl(possibleUrl, baseUrl) {
  try {
    if (!possibleUrl) return null;
    return new URL(possibleUrl, baseUrl).toString();
  } catch (_) {
    return null;
  }
}

function extractMetadata(html, url) {
  const $ = cheerio.load(html);

  const get = (selectors) => {
    for (const selector of selectors) {
      const value = $(selector).attr('content') || $(selector).attr('src');
      if (value) return value.toString().trim();
    }
    return null;
  };

  const title =
    get(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
    ($('title').first().text() || '').trim();

  const description =
    get(['meta[property="og:description"]', 'meta[name="twitter:description"]', 'meta[name="description"]']) ||
    '';

  const imageRaw =
    get(['meta[property="og:image"]', 'meta[name="twitter:image"]', 'meta[property="og:image:url"]']) ||
    $('img').first().attr('src');

  const siteName = get(['meta[property="og:site_name"]']) || new URL(url).hostname;
  const faviconRaw = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');

  const image = toAbsoluteUrl(imageRaw, url);
  const favicon = toAbsoluteUrl(faviconRaw, url) || toAbsoluteUrl('/favicon.ico', url);

  return { title, description, image, siteName, favicon, url };
}

router.post('/', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, message: 'Missing url' });
    }

    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobHunterBot/1.0; +https://jobhunter.example)'
      },
      validateStatus: (status) => status >= 200 && status < 400
    });

    const preview = extractMetadata(response.data, response.request?.res?.responseUrl || url);
    return res.json({ success: true, preview });
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Failed to fetch preview' });
  }
});

export default router;


