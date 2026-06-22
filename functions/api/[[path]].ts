const WORKER_URL = "https://questmasters-api.questmastersstartup.workers.dev";

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;
  const { method, headers } = context.request;

  // GET/HEAD: new Request() strips hop-by-hop headers (Connection, TE) automatically
  if (method === 'GET' || method === 'HEAD') {
    return fetch(new Request(target, { method, headers }));
  }

  // With body: read as text to avoid Pages Function ReadableStream passthrough issues
  const body = await context.request.text();
  console.log(`[proxy] ${method} ${url.pathname} body_len=${body.length}`);
  return fetch(new Request(target, { method, headers, body: body || undefined }));
};
