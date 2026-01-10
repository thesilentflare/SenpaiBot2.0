import * as https from 'https';

export interface CardPreview {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

/**
 * Fetch and parse web page for Open Graph metadata
 */
export async function fetchCardPreview(url: string): Promise<CardPreview> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          https.get(res.headers.location, handleResponse).on('error', reject);
          return;
        }
      }

      handleResponse(res);
    });

    request.on('error', reject);

    function handleResponse(res: any) {
      let data = '';

      res.on('data', (chunk: string) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Check if page exists (not a 404)
          if (res.statusCode === 404) {
            reject(new Error('Card not found'));
            return;
          }

          const preview = parseMetadata(data, url);
          resolve(preview);
        } catch (error) {
          reject(error);
        }
      });
    }
  });
}

/**
 * Parse HTML for Open Graph and meta tags
 */
function parseMetadata(html: string, url: string): CardPreview {
  const ogTitle =
    extractMetaTag(html, 'og:title') || extractTag(html, '<title>', '</title>');

  // Try multiple methods to get description
  let ogDescription = extractMetaTag(html, 'og:description');

  if (!ogDescription) {
    ogDescription = extractMetaTag(html, 'description');
  }

  // Try to extract from the wiki content if no meta description
  if (!ogDescription || ogDescription === 'No description available') {
    ogDescription = extractWikiDescription(html);
  }

  const ogImage = extractMetaTag(html, 'og:image');

  if (!ogTitle) {
    throw new Error('Could not extract card information');
  }

  return {
    title: cleanText(ogTitle),
    description: cleanText(ogDescription || 'No description available'),
    imageUrl: ogImage || '',
    url,
  };
}

/**
 * Extract description from wiki content
 */
function extractWikiDescription(html: string): string {
  // Pattern 1: Look for navbox-list within Card descriptions section
  let match = html.match(
    /Card descriptions[\s\S]{0,1000}?<td[^>]*class="[^"]*navbox-list[^"]*"[^>]*>([\s\S]+?)<\/td>/i,
  );
  if (match && match[1]) {
    let text = cleanHtmlTags(match[1]);
    if (text.length > 10 && !isUnwantedText(text)) {
      return text.length > 500 ? text.substring(0, 500) + '...' : text;
    }
  }

  // Pattern 2: Look for list items in navbox-list
  match = html.match(
    /<td[^>]*class="[^"]*navbox-list[^"]*"[^>]*>[\s\S]*?<li[^>]*>([\s\S]+?)<\/li>/i,
  );
  if (match && match[1]) {
    let text = cleanHtmlTags(match[1]);
    if (text.length > 10 && !isUnwantedText(text)) {
      return text.length > 500 ? text.substring(0, 500) + '...' : text;
    }
  }

  // Pattern 3: Portable infobox lore
  match = html.match(
    /data-source="lore"[\s\S]{0,200}?<div[^>]*class="pi-data-value[^"]*"[^>]*>([\s\S]+?)<\/div>/i,
  );
  if (match && match[1]) {
    let text = cleanHtmlTags(match[1]);
    if (text.length > 10 && !isUnwantedText(text)) {
      return text.length > 500 ? text.substring(0, 500) + '...' : text;
    }
  }

  // Pattern 4: Look for English followed by table cell
  match = html.match(
    />English<\/(?:th|td)>[\s\S]{0,200}?<td[^>]*>([\s\S]+?)<\/td>/i,
  );
  if (match && match[1]) {
    let text = cleanHtmlTags(match[1]);
    if (text.length > 10 && !isUnwantedText(text)) {
      return text.length > 500 ? text.substring(0, 500) + '...' : text;
    }
  }

  // Pattern 5: Search all list items for card-like content
  const listItems = html.match(/<li[^>]*>([\s\S]+?)<\/li>/gi);
  if (listItems) {
    for (const item of listItems) {
      let text = cleanHtmlTags(item);
      if (
        text.length > 30 &&
        !isUnwantedText(text) &&
        looksLikeCardText(text)
      ) {
        return text.length > 500 ? text.substring(0, 500) + '...' : text;
      }
    }
  }

  return 'Card information available on wiki page.';
}

/**
 * Check if text contains unwanted content
 */
function isUnwantedText(text: string): boolean {
  const unwanted = [
    'See the community',
    'wiki stats',
    '[hide]',
    '[show]',
    'navigation',
    'Jump to',
    'Special:',
    'Recent Images',
    'Edit',
    'Loading...',
  ];

  return (
    unwanted.some((phrase) => text.includes(phrase)) ||
    /^\s*\d+\s*$/.test(text) || // Just numbers
    /^[A-Z\s]{2,15}$/.test(text) || // Short all-caps text
    text.split(' ').length < 3 // Too short
  );
}

/**
 * Check if text looks like card description
 */
function looksLikeCardText(text: string): boolean {
  const cardTerms =
    /(?:wizard|dragon|warrior|attack|defense|monster|spell|trap|effect|summon|activate|target|destroy|draw|send|discard|banish|equip|tribute|flip|gain|lose|during|cannot|must|when|opponent|player|field|hand|deck|graveyard|GY|battle|damage|negate|special|ATK|DEF|Level|Rank|ultimate|powerful)/i;
  return cardTerms.test(text);
}

/**
 * Clean HTML tags and entities from text
 */
function cleanHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Extract meta tag content by property name
 */
function extractMetaTag(html: string, property: string): string {
  // Try og:property format
  let regex = new RegExp(
    `<meta\\s+property=["']og:${property}["']\\s+content=["']([^"']+)["']`,
    'i',
  );
  let match = html.match(regex);

  if (match) {
    return match[1];
  }

  // Try property format without og:
  regex = new RegExp(
    `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
    'i',
  );
  match = html.match(regex);

  if (match) {
    return match[1];
  }

  // Try name format
  regex = new RegExp(
    `<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`,
    'i',
  );
  match = html.match(regex);

  return match ? match[1] : '';
}

/**
 * Extract content between HTML tags
 */
function extractTag(html: string, startTag: string, endTag: string): string {
  const startIndex = html.indexOf(startTag);
  if (startIndex === -1) return '';

  const contentStart = startIndex + startTag.length;
  const endIndex = html.indexOf(endTag, contentStart);
  if (endIndex === -1) return '';

  return html.substring(contentStart, endIndex);
}

/**
 * Clean and decode HTML entities
 */
function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
