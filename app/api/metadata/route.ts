import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
// import puppeteer from 'puppeteer'; // Puppeteer is heavy and might be overkill/tricky in some serverless envs, let's stick to smart scraping first

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Heuristic: Check if it's a YouTube Channel
    const isYoutubeChannel = url.includes('youtube.com/@') || url.includes('youtube.com/channel/') || url.includes('youtube.com/c/');

    if (isYoutubeChannel) {
      // For channels, we want to fetch metadata about the channel itself
      // Note: Fetching dynamic channel content (like latest videos) usually requires the YouTube Data API or Puppeteer
      // For this lightweight version, we'll fetch the page title and description which usually contains the channel name and bio.
      
      // Optimization: Use a lightweight fetch first. 
      // Note: YouTube often blocks simple fetch requests with 429/403 without cookies/headers.
      // We can try to use a more robust method if needed, but let's try standard fetch with headers first.
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        console.warn('Fetch failed for channel, returning basic info');
        return NextResponse.json({ title: url, description: 'YouTube Channel (Metadata fetch restricted)' });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') || $('title').text().replace(' - YouTube', '').trim() || url;
      const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || 'YouTube Channel';
      
      return NextResponse.json({ title, description: `CHANNEL: ${description}` });
    }

    // Standard fallback for single videos / other sites
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ title: url, description: '' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

    return NextResponse.json({ title, description });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    // Return empty on error to allow UI to continue
    return NextResponse.json({ title: url, description: '' });
  }
}
