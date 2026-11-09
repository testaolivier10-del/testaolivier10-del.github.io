/* Runs only when no static file matched the request exactly (assets come
   first, so ordinary page and file loads never reach this). Recreates the URL
   rules GitHub Pages had, so no existing link changes. */
const HAS_EXT = /\/[^/]*\.[a-z0-9]+$/i;

async function asset(env, request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  const r = await env.ASSETS.fetch(new Request(url, request));
  return r.status === 200 ? r : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (request.method === 'GET' || request.method === 'HEAD') {
      if (p.endsWith('/')) {
        const r = await asset(env, request, p + 'index.html');
        if (r) return r;
      } else if (!HAS_EXT.test(p)) {
        const page = await asset(env, request, p + '.html');
        if (page) return page;
        if (await asset(env, request, p + '/index.html')) {
          url.pathname = p + '/';
          return Response.redirect(url.toString(), 301);
        }
      }
    }
    const nf = await asset(env, request, '/404.html');
    return new Response(nf ? nf.body : 'Not found', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  },
};
