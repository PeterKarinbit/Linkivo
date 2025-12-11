// Lightweight external research helper (e.g., Wikipedia)
// Returns array: [{ title, source, summary, url, date }]

export async function searchWikipedia(query, limit = 5) {
  try {
    const endpoint = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(query)}&limit=${limit}`;
    const resp = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return [];
    const data = await resp.json();
    const pages = data?.pages || [];
    const results = [];
    for (const p of pages) {
      try {
        const summaryResp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.title)}`, { headers: { 'Accept': 'application/json' } });
        if (!summaryResp.ok) continue;
        const s = await summaryResp.json();
        results.push({
          title: s?.title || p.title,
          source: 'Wikipedia',
          summary: s?.extract || '',
          url: s?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
          date: new Date().toISOString(),
        });
      } catch (_) { /* ignore */ }
    }
    return results;
  } catch (e) {
    console.warn('searchWikipedia failed:', e?.message || e);
    return [];
  }
}

export async function getExternalResearchData({ profileTerms = [], query = '', limit = 5 }) {
  const terms = query || profileTerms.join(' ');
  if (!terms) return [];
  const wiki = await searchWikipedia(terms, limit);
  return wiki.map(w => ({
    title: w.title,
    source: w.source,
    content: w.summary,
    url: w.url,
    relevance: 'high',
    date: w.date,
  }));
}


