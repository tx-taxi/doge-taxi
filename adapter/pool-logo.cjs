'use strict';

const fs = require('node:fs');

const upstream = 'https://mempool.space/resources/mining-pools/';
const cache = new Map();
const inFlight = new Map();
const validName = /^([a-z0-9-]{1,50})(\.light)?\.svg$/;

function createPoolLogoLoader(defaultPath, aliases = {}) {
  const fallback = fs.readFileSync(defaultPath);

  async function download(name) {
    const response = await fetch(upstream + name, {signal: AbortSignal.timeout(4000)});
    if (!response.ok || !response.headers.get('content-type')?.includes('image/svg+xml')) {
      throw new Error('Pool logo unavailable');
    }
    const logo = Buffer.from(await response.arrayBuffer());
    if (logo.length > 256_000) throw new Error('Pool logo too large');
    return logo;
  }

  async function load(name) {
    const match = validName.exec(name);
    if (!match || match[1] === 'unknown' || match[1] === 'default') return fallback;

    const slug = aliases[match[1]] || match[1];
    const remoteName = slug + (match[2] || '') + '.svg';
    const saved = cache.get(remoteName);
    if (saved && saved.expires > Date.now()) return saved.logo;
    if (inFlight.has(remoteName)) return inFlight.get(remoteName);

    const task = (async () => {
      let logo;
      try {
        logo = await download(remoteName);
      } catch {
        if (match[2]) {
          try { logo = await download(slug + '.svg'); } catch {}
        }
      }
      logo ||= fallback;
      cache.set(remoteName, {logo, expires: Date.now() + (logo === fallback ? 60 * 60_000 : 24 * 60 * 60_000)});
      return logo;
    })();
    inFlight.set(remoteName, task);
    try { return await task; } finally { inFlight.delete(remoteName); }
  }

  return load;
}

module.exports = {createPoolLogoLoader};
