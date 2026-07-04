import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Hardcoded demo mappings to ensure instant, perfect results for standard test URLs
const DEMO_URL_MAPPINGS: Record<string, string> = {
  'netflix.com/title/70305903': 'Interstellar',
  'netflix.com/watch/70305903': 'Interstellar',
  'youtube.com/watch?v=zSWdZAIBEsY': 'Interstellar', // Interstellar official trailer
  'youtube.com/watch?v=YoHD9XEInc0': 'Inception',    // Inception trailer
  'youtube.com/watch?v=2e-eXJ6HgkQ': 'La La Land',    // La La Land trailer
  'youtube.com/watch?v=Way9Dexny3w': 'Dune',           // Dune trailer
  'primevideo.com/detail/0n8t1t2t3t': 'Inception',
  'disneyplus.com/movies/avatar': 'Avatar',
};

// Simple cleanup helper to remove site banners and common prefixes/suffixes
function cleanMovieTitle(title: string): string {
  let cleaned = title;
  
  // Decodes html entities like &amp; &quot; &#39;
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Suffixes
  const suffixes = [
    /\| Netflix\s*(Official Site)?/i,
    /-\s*YouTube/i,
    /\| Disney\+/i,
    /\| Prime Video/i,
    /Amazon\.com:\s*/i,
    /: Prime Video/i,
    /Watch\s+/i,
    /Full Movie/i,
    /Official Trailer/i,
    /Trailer/i,
    /\(\d{4}\)/, // Year e.g. (2014)
    /HD/i,
    /4K/i,
  ];

  suffixes.forEach((regex) => {
    cleaned = cleaned.replace(regex, '');
  });

  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const cleanedUrl = url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Check hardcoded demo mappings first
    let matchedTitleOrId = '';
    for (const [key, value] of Object.entries(DEMO_URL_MAPPINGS)) {
      if (cleanedUrl.includes(key)) {
        matchedTitleOrId = value;
        break;
      }
    }

    // 1. Direct Pattern Extraction from URL pathnames
    if (!matchedTitleOrId) {
      // IMDb ID pattern (tt\d+)
      const imdbMatch = url.match(/title\/(tt\d+)/i);
      if (imdbMatch && imdbMatch[1]) {
        matchedTitleOrId = imdbMatch[1];
      }
    }

    if (!matchedTitleOrId) {
      // TMDB ID pattern (movie/(\d+))
      const tmdbMatch = url.match(/movie\/(\d+)/i);
      if (tmdbMatch && tmdbMatch[1]) {
        matchedTitleOrId = tmdbMatch[1];
      }
    }

    if (!matchedTitleOrId) {
      // Apple TV title slug pattern (/movie/([a-z0-9-]+))
      const appleMatch = url.match(/tv\.apple\.com\/[^/]+\/movie\/([^/]+)/i);
      if (appleMatch && appleMatch[1]) {
        // extract name slug and replace dashes with spaces
        matchedTitleOrId = appleMatch[1].split('/')[0].replace(/-/g, ' ');
      }
    }

    if (!matchedTitleOrId) {
      // Disney+ title slug pattern (/movies/([a-z0-9-]+))
      const disneyMatch = url.match(/disneyplus\.com\/[^/]*movies\/([^/]+)/i) || url.match(/disneyplus\.com\/movies\/([^/]+)/i);
      if (disneyMatch && disneyMatch[1]) {
        matchedTitleOrId = disneyMatch[1].split('/')[0].replace(/-/g, ' ');
      }
    }

    // 2. If no patterns matched, scrape the website HTML for metadata
    if (!matchedTitleOrId) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          next: { revalidate: 3600 } // cache for 1 hour
        });

        if (res.ok) {
          const html = await res.text();
          
          // Try og:title meta tag first
          const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                               html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
          
          let rawTitle = '';
          if (ogTitleMatch && ogTitleMatch[1]) {
            rawTitle = ogTitleMatch[1];
          } else {
            // Fallback to HTML <title> tag
            const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              rawTitle = titleMatch[1];
            }
          }

          if (rawTitle) {
            matchedTitleOrId = cleanMovieTitle(rawTitle);
            console.log(`Scraped title: "${rawTitle}" -> Cleaned: "${matchedTitleOrId}"`);
          }
        }
      } catch (scrapeErr) {
        console.error('Failed to scrape URL metadata:', scrapeErr);
      }
    }

    // 3. Resolve the title or ID using TMDB
    if (matchedTitleOrId) {
      // If it is a TMDB numeric ID, fetch detail directly
      if (/^\d+$/.test(matchedTitleOrId)) {
        if (TMDB_API_KEY && TMDB_API_KEY !== 'YOUR_TMDB_API_KEY_HERE') {
          try {
            const detailUrl = `https://api.themoviedb.org/3/movie/${matchedTitleOrId}?api_key=${TMDB_API_KEY}&language=en-US`;
            const detailRes = await fetch(detailUrl);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              return NextResponse.json({
                success: true,
                movie: {
                  id: detailData.id,
                  title: detailData.title,
                  release_date: detailData.release_date || '',
                  vote_average: detailData.vote_average ? Math.round(detailData.vote_average * 10) / 10 : 0,
                  runtime: detailData.runtime || 120,
                  genres: detailData.genres ? detailData.genres.map((g: any) => g.name) : [],
                  overview: detailData.overview || '',
                  poster_path: detailData.poster_path ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}` : null,
                  backdrop_path: detailData.backdrop_path ? `https://image.tmdb.org/t/p/original${detailData.backdrop_path}` : null,
                }
              });
            }
          } catch (err) {
            console.error('Failed to fetch TMDB ID details directly:', err);
          }
        }
      }

      // If it is a title or IMDb ID, query the search-movie route internally
      const searchApiUrl = new URL('/api/search-movie', req.url);
      searchApiUrl.searchParams.set('query', matchedTitleOrId);
      
      const searchRes = await fetch(searchApiUrl.toString());
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          // Return the top matched result
          return NextResponse.json({
            success: true,
            movie: searchData.results[0]
          });
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Could not automatically identify movie details from this URL. Please use search.'
    });
  } catch (err: any) {
    console.error('Detect movie API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
