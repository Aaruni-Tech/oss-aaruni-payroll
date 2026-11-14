// Isolated targets use native bindings only. Never reuse payroll REST credentials.
export async function queryDatabase(env, sql, params = []) {
  if (!env?.DB?.prepare) throw new Error('A dedicated D1 DB binding is required');
  const stmt = env.DB.prepare(sql).bind(...params);
  if (/^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql)) {
    const result = await stmt.all();
    return { success: true, results: result.results || [] };
  }
  const result = await stmt.run();
  return { success: true, results: [result] };
}

export async function handleInquiry(request, env) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  const reply = (body, status) => new Response(JSON.stringify(body), { status, headers });
  // Public sites accept inquiries; reading customer messages belongs in an authenticated admin service.
  if (request.method !== 'POST') return reply({ success: false, error: 'Method not allowed' }, 405);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ success: false, error: 'JSON required' }, 415);
  // Bound the actual stream, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply({ success: false, error: 'Request body required' }, 400);
  const chunks = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16384) { await reader.cancel(); return reply({ success: false, error: 'Request too large' }, 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { return reply({ success: false, error: 'Invalid JSON' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ success: false, error: 'Object required' }, 400);
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message || message.length > 8000) return reply({ success: false, error: 'Valid email and message required' }, 400);
  const ref = `INQ-${crypto.randomUUID()}`;
  try {
    // Provision the dedicated inquiry database using migrations/inquiries.sql before deployment.
    await queryDatabase(env, 'INSERT INTO inquiries (id, sender_email, org_name, offering, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [ref, email, String(body.company || body.org || body.name || '').slice(0,300), String(body.offering || body.services || 'General inquiry').slice(0,300), message, new Date().toISOString()]);
    return reply({ success: true, ref, emailDelivery: { sent: false, mode: 'stored' } }, 201);
  } catch {
    return reply({ success: false, error: 'Inquiry storage is unavailable. Please use the email link.' }, 503);
  }
}

export function createDeploymentWorker(target, handleCloudApiV1) {
  if (!['corporate', 'cloud', 'payroll'].includes(target)) throw new Error('Unknown deployment target');
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const apiPath = /^\/(?:api\/)?v1(?:\/|$)/.test(pathname);
      if (target === 'cloud' && (apiPath || url.hostname === 'api.aarunicloud.com')) {
        return handleCloudApiV1(request, env, queryDatabase);
      }
      if (['corporate', 'cloud'].includes(target) && pathname === '/api/inquiries') return handleInquiry(request, env);
      if (pathname.startsWith('/api/') || apiPath) return new Response('Not found', { status: 404 });
      // Prevent SPA fallback from accidentally serving application HTML for excluded paths.
      const allowed = target === 'corporate' ? ['/', '/index.html', '/trust', '/trust.html'] :
        ['/', '/index.html', '/cloud', '/cloud.html', '/console', '/console.html', '/voice', '/voice.html', '/services', '/services.html', '/docs', '/docs.html', '/trust', '/trust.html'];
      const filePath = /\.[a-z0-9]+$/i.test(pathname) && !/\.(html|js|mjs|json|toml|sql)$/i.test(pathname);
      const publicData = ['/service-catalog.json', '/robots.txt', '/sitemap.xml'].includes(pathname);
      const cloudSdk = target === 'cloud' && pathname.startsWith('/sdk/');
      if (!allowed.includes(pathname) && !filePath && !publicData && !cloudSdk) return new Response('Not found', { status: 404 });
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
      if (pathname === '/' || pathname === '/index.html') {
        url.pathname = target === 'corporate' ? '/index.html' : url.hostname === 'console.aarunicloud.com' ? '/console.html' : '/cloud.html';
      } else if (allowed.includes(pathname) && !pathname.endsWith('.html')) url.pathname += '.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
  };
}
