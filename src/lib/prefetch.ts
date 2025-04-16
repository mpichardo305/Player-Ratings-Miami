export async function prefetchLeaderboardStats() {
  const urls = [
    '/api/stats/longest-win-streak',
    '/api/stats/best-player',
    '/api/stats/most-games',
    '/api/stats/streak-leader',
    '/api/stats/most-improved'
  ];

  return Promise.all(
    urls.map(url => 
      fetch(url, { next: { revalidate: 300 } }) // Cache for 5 minutes
    )
  );
}