import * as https from 'https';
import * as http from 'http';

export interface ImageboardPost {
  id: number;
  fileUrl: string;
  postUrl: string;
  source: string;
}

/**
 * Fetch JSON from an API endpoint
 */
async function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        Host: urlObj.host,
        Connection: 'keep-alive',
      },
    };

    // Use http or https based on URL
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(
                new Error(
                  `HTTP ${res.statusCode} for ${url}: ${data.substring(0, 100)}`,
                ),
              );
              return;
            }
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Fetch a random post from Yandere
 */
export async function fetchYandere(): Promise<ImageboardPost> {
  const apiUrl = 'https://yande.re/post.json?limit=1';
  const json = await fetchJson(apiUrl);

  if (!json || json.length === 0) {
    throw new Error('API returned no results');
  }

  const post = json[0];

  if (!post.id || !post.sample_url) {
    throw new Error('Failed to parse response');
  }

  return {
    id: post.id,
    fileUrl: post.sample_url,
    postUrl: `https://yande.re/post/show/${post.id}`,
    source: 'yandere',
  };
}

/**
 * Fetch a random post from Safebooru
 */
export async function fetchSafebooru(): Promise<ImageboardPost> {
  const apiUrl =
    'https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=1';
  const json = await fetchJson(apiUrl);

  if (!json || json.length === 0) {
    throw new Error('API returned no results');
  }

  const post = json[0];

  if (!post.id || !post.image || !post.directory) {
    throw new Error('Failed to parse response');
  }

  return {
    id: post.id,
    fileUrl: `https://safebooru.org/images/${post.directory}/${post.image}`,
    postUrl: `https://safebooru.org/index.php?page=post&s=view&id=${post.id}`,
    source: 'safebooru',
  };
}

/**
 * Download image data from URL
 */
export async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'image/*',
      },
    };

    // Use http or https based on URL
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          resolve(Buffer.concat(chunks));
        });
      })
      .on('error', reject);
  });
}
