import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
// import TikTokScraper from 'tiktok-scraper-ts'; // Removed due to import issues

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isYoutubeChannel = url.includes('youtube.com/@') || url.includes('youtube.com/channel/') || url.includes('youtube.com/c/');
    const isTiktokProfile = url.includes('tiktok.com/@');

    if (isTiktokProfile) {
        try {
            // Extract username from URL
            const username = url.split('@')[1].split('?')[0].split('/')[0];
            
            // Direct scrape attempt with headers (lightweight fallback)
            // TikTok is hard to scrape without a library/browser, but the library is failing.
            // Let's try a simple fetch first, if it fails, we just return the URL title.
            
            const response = await fetch(url, {
                headers: {
                     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                const $ = cheerio.load(html);
                
                // TikTok meta tags
                const title = $('meta[property="og:title"]').attr('content') || `${username} on TikTok`;
                const description = $('meta[property="og:description"]').attr('content') || '';
                
                // Try to find stats in description if available (e.g. "X Followers, Y Likes")
                return NextResponse.json({ 
                    title, 
                    description: `TIKTOK PROFILE: ${description}` 
                });
            }

            return genericFetch(url);

        } catch (e) {
            console.error('TikTok scrape failed:', e);
            return genericFetch(url);
        }
    }

    if (isYoutubeChannel) {
      try {
        // Fetch the videos page to ensure we get video list content
        // If user provided /@Handle, appending /videos usually works to get the video tab
        const videosUrl = url.endsWith('/videos') ? url : `${url}/videos`;
        
        const response = await fetch(videosUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        if (!response.ok) {
          // Fallback to original URL if /videos fails
          const fallbackResponse = await fetch(url, {
             headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
          });
          if (!fallbackResponse.ok) throw new Error('Channel fetch failed');
          return parseChannelPage(await fallbackResponse.text(), url);
        }

        const html = await response.text();
        return parseChannelPage(html, url);

      } catch (e) {
        console.warn('Deep scrape failed, returning basic info', e);
        return NextResponse.json({ title: url, description: 'YouTube Channel (Video list fetch failed)' });
      }
    }

    return genericFetch(url);

  } catch (error) {
    console.error('Metadata fetch error:', error);
    // Return empty on error to allow UI to continue
    return NextResponse.json({ title: '', description: '' });
  }
}

async function genericFetch(url: string) {
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
}

function parseChannelPage(html: string, url: string) {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr('content') || $('title').text().replace(' - YouTube', '').trim() || url;
  const metaDescription = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

  // Extract ytInitialData
  let recentVideos: string[] = [];
  try {
    const scriptPattern = /var ytInitialData = ({.*?});/;
    const match = html.match(scriptPattern);
    if (match && match[1]) {
      const data = JSON.parse(match[1]);
      
      // Traverse to find video items. This path is notoriously unstable and changes, but standard paths are:
      // tabs -> tabRenderer -> content -> richGridRenderer -> contents -> richItemRenderer -> content -> videoRenderer
      const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
      const videosTab = tabs?.find((t: any) => t?.tabRenderer?.selected) || tabs?.[1]; // usually index 1 is videos if on home
      
      const contentRoot = videosTab?.tabRenderer?.content?.richGridRenderer?.contents 
                       || videosTab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items;

      if (contentRoot && Array.isArray(contentRoot)) {
         recentVideos = contentRoot
          .map((item: any) => {
            const video = item?.richItemRenderer?.content?.videoRenderer || item?.gridVideoRenderer;
            return video?.title?.runs?.[0]?.text;
          })
          .filter((t: string) => t); // Filter undefined/null
      }
    }
  } catch (e) {
    console.error('Error parsing ytInitialData:', e);
  }

  let description = `CHANNEL BIO: ${metaDescription}`;
  if (recentVideos.length > 0) {
    description += `\n\nRECENT VIDEOS:\n- ${recentVideos.slice(0, 10).join('\n- ')}`;
  }

  return NextResponse.json({ title, description });
}
