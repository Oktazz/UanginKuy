import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  imageUrl: string;
}

// Extend rss-parser type to support media and enclosure fields
type CustomItem = {
  'content:encoded'?: string;
  'media:content'?: { $: { url: string } };
  'media:thumbnail'?: { $: { url: string } };
  enclosure?: { url: string; type?: string };
  description?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      'content:encoded',
      ['media:content', 'media:content', { keepArray: false }],
      ['media:thumbnail', 'media:thumbnail', { keepArray: false }],
      'enclosure',
    ],
  },
});

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80';
const RSS_URL = 'https://mongabay.co.id/feed/';
const RSS_TIMEOUT_MS = 10_000;

function extractImage(item: Parser.Item & CustomItem): string {
  // 1. Try media:content (common in WordPress RSS)
  const mediaContent = item['media:content'];
  if (mediaContent?.$?.url) return mediaContent.$.url;

  // 2. Try media:thumbnail
  const mediaThumbnail = item['media:thumbnail'];
  if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;

  // 3. Try enclosure (podcast/image attachments)
  const enclosure = item.enclosure;
  if (enclosure?.url && enclosure.url.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
    return enclosure.url;
  }

  // 4. Regex search inside content:encoded — try both double and single quotes
  const content = (item['content:encoded'] || item.description || '') as string;
  const imgDoubleQuote = content.match(/<img[^>]+src="([^"]+)"/i);
  if (imgDoubleQuote?.[1]) return imgDoubleQuote[1];

  const imgSingleQuote = content.match(/<img[^>]+src='([^']+)'/i);
  if (imgSingleQuote?.[1]) return imgSingleQuote[1];

  // 5. Try to find any wp-content image URL in the raw content
  const wpImage = content.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)/i);
  if (wpImage?.[0]) return wpImage[0];

  // 6. Fallback to a generic nature image
  return FALLBACK_IMAGE;
}

export async function getEnvironmentalNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(RSS_URL, {
      headers: {
        Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
        'User-Agent': 'UanginKuy/1.0',
      },
      next: { revalidate: 3600 }, // Cache selama 1 jam di Next.js
      signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
    });
    
    if (!response.ok) {
      console.warn(
        `[environmental-news] RSS unavailable (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`,
      );
      return [];
    }
    
    const xmlData = await response.text();
    const feed = await parser.parseString(xmlData);

    return feed.items.slice(0, 5).map((item) => {
      const imageUrl = extractImage(item as Parser.Item & CustomItem);

      // Clean up snippet by stripping HTML tags
      const rawSnippet = item.contentSnippet || item.description || '';
      const snippet = rawSnippet.replace(/(<([^>]+)>)/gi, '').substring(0, 120) + '...';

      return {
        title: item.title || 'Berita Lingkungan',
        link: item.link || '#',
        pubDate: item.pubDate
          ? new Date(item.pubDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '',
        snippet,
        imageUrl,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[environmental-news] RSS fetch skipped: ${message}`);
    return [];
  }
}
