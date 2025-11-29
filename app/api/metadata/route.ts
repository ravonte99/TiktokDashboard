import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      },
    });

    if (!response.ok) {
      // If fetch fails (e.g. 403/404), return a graceful error but don't crash
      return NextResponse.json({ title: '', description: '' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    return NextResponse.json({ title, description });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    // Return empty on error to allow UI to continue
    return NextResponse.json({ title: '', description: '' });
  }
}

