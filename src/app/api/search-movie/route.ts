import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Static mapping of TMDB genre IDs to human-readable names for quick lookup
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Curated list of mock movies for fallback when TMDB API key is missing or placeholder.
// We use verified active TMDB paths for primary assets, and stable high-quality Unsplash assets for backdrops.
const MOCK_MOVIES = [
  {
    id: 157336,
    title: 'Interstellar',
    release_date: '2014-11-05',
    vote_average: 8.4,
    runtime: 169,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    poster_path: '/pbrkL804c8yAv3zBZR4QPEafpAR.jpg', // Verified active Interstellar poster path
    backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop', // Stable space backdrop
  },
  {
    id: 27205,
    title: 'Inception',
    release_date: '2010-07-15',
    vote_average: 8.3,
    runtime: 148,
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    overview: 'Cobb, a skilled thief who steals valuable secrets from deep within the subconscious during the dream state, is offered a chance to have his history erased.',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', // Verified active Inception poster path
    backdrop_path: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop', // Stable dream mirror-cityscape backdrop
  },
  {
    id: 597,
    title: 'Titanic',
    release_date: '1997-11-18',
    vote_average: 7.9,
    runtime: 194,
    genres: ['Drama', 'Romance'],
    overview: '101-year-old Rose DeWitt Bukater tells the story of her life aboard the Titanic, 84 years later, to her granddaughter.',
    poster_path: 'https://images.unsplash.com/photo-1500077423678-25eead48513a?q=80&w=500&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 19995,
    title: 'Avatar',
    release_date: '2009-12-15',
    vote_average: 7.6,
    runtime: 162,
    genres: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi'],
    overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following his orders and protecting the world he feels is his home.',
    poster_path: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=500&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 313369,
    title: 'La La Land',
    release_date: '2016-11-29',
    vote_average: 7.9,
    runtime: 128,
    genres: ['Comedy', 'Drama', 'Romance', 'Music'],
    overview: 'Mia, an aspiring actress, serves lattes to movie stars in between auditions and Sebastian, a jazz musician, scrapes by playing cocktail party gigs in dingy bars.',
    poster_path: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 438631,
    title: 'Dune',
    release_date: '2021-09-15',
    vote_average: 7.8,
    runtime: 155,
    genres: ['Sci-Fi', 'Adventure'],
    overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe.',
    poster_path: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=500&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop',
  }
];

// Simple in-memory cache to prevent hitting rate limits
const searchCache = new Map<string, any>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  if (searchCache.has(cacheKey)) {
    return NextResponse.json({ results: searchCache.get(cacheKey) });
  }

  const isExternalId = /^tt\d+$/.test(cacheKey); // Check if it's an IMDb ID

  // 1. Query TMDB if API key is configured
  if (TMDB_API_KEY && TMDB_API_KEY !== 'YOUR_TMDB_API_KEY_HERE' && TMDB_API_KEY.trim() !== '') {
    try {
      let results: any[] = [];

      if (isExternalId) {
        // IMDb ID find lookup
        const findUrl = `https://api.themoviedb.org/3/find/${cacheKey}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=en-US`;
        const res = await fetch(findUrl);
        if (res.ok) {
          const data = await res.json();
          results = data.movie_results || [];
        }
      } else {
        // Regular query search
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`;
        const res = await fetch(searchUrl);
        if (res.ok) {
          const data = await res.json();
          results = data.results || [];
        }
      }

      // Limit search to 5 items and fetch detailed metadata (runtime, full genre list, etc.) in parallel
      const enrichedResults = await Promise.all(
        results.slice(0, 5).map(async (movie: any) => {
          try {
            // Fetch runtime and precise genres
            const detailUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`;
            const detailRes = await fetch(detailUrl);
            let runtime = 120; // fallback default runtime
            let genreNames = movie.genre_ids ? movie.genre_ids.map((id: number) => GENRE_MAP[id] || '').filter(Boolean) : [];
            let overview = movie.overview || '';

            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData.runtime) runtime = detailData.runtime;
              if (detailData.genres) {
                genreNames = detailData.genres.map((g: any) => g.name);
              }
              if (detailData.overview) overview = detailData.overview;
            }

            return {
              id: movie.id,
              title: movie.title,
              release_date: movie.release_date || '',
              vote_average: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : 0, // round to 1 decimal place
              runtime,
              genres: genreNames,
              overview,
              poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
              backdrop_path: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
            };
          } catch (err) {
            console.error(`Error enriching movie id ${movie.id}:`, err);
            return {
              id: movie.id,
              title: movie.title,
              release_date: movie.release_date || '',
              vote_average: movie.vote_average || 0,
              runtime: 120,
              genres: movie.genre_ids ? movie.genre_ids.map((id: number) => GENRE_MAP[id] || '').filter(Boolean) : [],
              overview: movie.overview || '',
              poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
              backdrop_path: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
            };
          }
        })
      );

      // Cache and return
      searchCache.set(cacheKey, enrichedResults);
      return NextResponse.json({ results: enrichedResults });

    } catch (error) {
      console.error('TMDB Search API error:', error);
      // fallback to mock search if fetch fails
    }
  }

  // 2. Fallback Mock Search (case-insensitive substring match)
  const filtered = MOCK_MOVIES.filter((m) =>
    m.title.toLowerCase().includes(cacheKey)
  ).map((m) => ({
    ...m,
    poster_path: m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w500${m.poster_path}`,
    backdrop_path: m.backdrop_path.startsWith('http') ? m.backdrop_path : `https://image.tmdb.org/t/p/original${m.backdrop_path}`,
  }));

  // If no match in mock database, return a structured placeholder result
  if (filtered.length === 0) {
    const placeholder = {
      id: 999999,
      title: query,
      release_date: new Date().getFullYear().toString(),
      vote_average: 7.0,
      runtime: 120,
      genres: ['Date Night'],
      overview: 'A movie night together filled with popcorn, cozy blankets, and great memories.',
      poster_path: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
      backdrop_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop',
    };
    return NextResponse.json({ results: [placeholder] });
  }

  return NextResponse.json({ results: filtered });
}
