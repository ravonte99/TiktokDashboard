import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isYoutubeChannel = url.includes('youtube.com/@') || url.includes('youtube.com/channel/') || url.includes('youtube.com/c/');
    const isTiktokProfile = url.includes('tiktok.com/@');

    if (isTiktokProfile) {
      // RapidAPI Integration for TikTok
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      const rapidApiHost = process.env.RAPIDAPI_HOST || 'tiktok-scraper7.p.rapidapi.com';
      
      if (rapidApiKey) {
         try {
            const username = url.split('@')[1].split('?')[0].split('/')[0];
            
            // Generic fetch using the configured host
            // Note: Most TikTok scrapers on RapidAPI use similar endpoints like /user/info or /user/details
            // We might need to adjust based on the specific API chosen.
            // Current implementation assumes 'tiktok-scraper7' style:
            // - Info: /user/info?unique_id=username
            // - Posts: /user/posts?unique_id=username
            //
            // UPDATE for tiktok-api23 (and some others): They often use /api/user/info
            
            console.log(`Fetching TikTok profile for ${username} using host: ${rapidApiHost}`);

            let basePath = '';
            let idParam = 'unique_id'; // Default for most scrapers

            // Robust check for tiktok-api23
            if (rapidApiHost.includes('tiktok-api23')) {
               basePath = '/api';
               idParam = 'uniqueId'; // API23 uses camelCase
            }

            const fetchUrl = `https://${rapidApiHost}${basePath}/user/info?${idParam}=${username}`;
            console.log(`RapidAPI Request URL: ${fetchUrl}`);
            
            const response = await fetch(fetchUrl, {
               method: 'GET',
               headers: {
                  'x-rapidapi-key': rapidApiKey,
                  'x-rapidapi-host': rapidApiHost
               },
               cache: 'no-store' // Ensure we don't get cached 400s
            });

            if (response.ok) {
               const data = await response.json();
               
               // Debug log to see structure
               console.log('RapidAPI Response Keys:', Object.keys(data));
               if (data.userInfo) console.log('Found data.userInfo');
               if (data.data) console.log('Found data.data');

               // API23 specific mapping
               const user = data.userInfo?.user || data.data?.user || data.userInfo;
               const stats = data.userInfo?.stats || data.data?.stats;
               
               // API23 often puts user info directly in userInfo object without a nested 'user' key
               const finalUser = user?.uniqueId ? user : (data.userInfo || user); 

               if (finalUser && finalUser.uniqueId) {
                   console.log(`Found user: ${finalUser.uniqueId}`);
                   let description = `TIKTOK PROFILE: ${finalUser.nickname} (@${finalUser.uniqueId})\nBIO: ${finalUser.signature}`;
                   if (stats) {
                       description += `\nSTATS: ${stats.followerCount} Followers, ${stats.heartCount} Likes`;
                   }

                   // Fetch recent videos to give context about content style
                   try {
                       // Attempt to fetch posts from the same RapidAPI provider
                       console.log(`Fetching recent videos for ${username} via RapidAPI...`);
                       
                       const postsUrl = `https://${rapidApiHost}${basePath}/user/posts?${idParam}=${username}&count=10`;
                       console.log(`RapidAPI Posts URL: ${postsUrl}`);

                       const postsResponse = await fetch(postsUrl, {
                           method: 'GET',
                           headers: {
                               'x-rapidapi-key': rapidApiKey,
                               'x-rapidapi-host': rapidApiHost
                           },
                           cache: 'no-store'
                       });
        
                       if (postsResponse.ok) {
                           const postsData = await postsResponse.json();
                           const videos = postsData.data?.videos;
                           console.log(`Fetched ${videos?.length || 0} videos for ${username}`);
        
                           if (videos && Array.isArray(videos)) {
                               const videoList = videos.map((v: any) => {
                                   const caption = v.title || v.desc || 'No caption';
                                   const plays = v.playCount || v.stats?.playCount || 0;
                                   return `- "${caption.replace(/\n/g, ' ')}" (${plays} views)`;
                               }).join('\n');
                               description += `\n\nRECENT VIDEOS:\n${videoList}`;
                           }
                       } else {
                           console.warn(`RapidAPI posts fetch failed: ${postsResponse.status} ${postsResponse.statusText}`);
                       }
                   } catch (postError) {
                       console.warn('Failed to fetch TikTok posts:', postError);
                   }
                   
                   return NextResponse.json({ 
                       title: `${user.nickname} (@${user.uniqueId}) on TikTok`, 
                       description 
                   });
               }
            } else {
                const errorText = await response.text();
                console.warn(`RapidAPI fetch failed: ${response.status} ${response.statusText}`, errorText);
            }
         } catch (e) {
            console.error('RapidAPI error:', e);
         }
      }
      
      // Fallback if no key or API fails
      return genericFetch(url);
    }

    if (isYoutubeChannel) {
      try {
        const videosUrl = url.endsWith('/videos') ? url : `${url}/videos`;
        const response = await fetch(videosUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        if (!response.ok) {
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
    return NextResponse.json({ title: '', description: '' });
  }
}

async function genericFetch(url: string) {
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

  let recentVideos: string[] = [];
  try {
    const scriptPattern = /var ytInitialData = ({.*?});/;
    const match = html.match(scriptPattern);
    if (match && match[1]) {
      const data = JSON.parse(match[1]);
      const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
      const videosTab = tabs?.find((t: any) => t?.tabRenderer?.selected) || tabs?.[1]; 
      const contentRoot = videosTab?.tabRenderer?.content?.richGridRenderer?.contents 
                       || videosTab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items;

      if (contentRoot && Array.isArray(contentRoot)) {
         recentVideos = contentRoot
          .map((item: any) => {
            const video = item?.richItemRenderer?.content?.videoRenderer || item?.gridVideoRenderer;
            return video?.title?.runs?.[0]?.text;
          })
          .filter((t: string) => t);
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
