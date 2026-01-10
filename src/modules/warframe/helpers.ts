import * as https from 'https';

export interface WikiPreview {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

/**
 * Fetch and parse web page for Open Graph metadata
 */
export async function fetchWikiPreview(url: string): Promise<WikiPreview> {
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
            reject(new Error('Entry not found'));
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
function parseMetadata(html: string, url: string): WikiPreview {
  const ogTitle =
    extractMetaTag(html, 'og:title') || extractTag(html, '<title>', '</title>');

  let ogDescription = extractMetaTag(html, 'og:description');

  if (!ogDescription) {
    ogDescription = extractMetaTag(html, 'description');
  }

  const ogImage = extractMetaTag(html, 'og:image');

  if (!ogTitle) {
    throw new Error('Could not extract wiki information');
  }

  return {
    title: cleanText(ogTitle),
    description: cleanText(ogDescription || 'No description available'),
    imageUrl: ogImage || '',
    url,
  };
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
