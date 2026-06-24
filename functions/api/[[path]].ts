const WORKER_URL = "https://questmasters-api.questmastersstartup.workers.dev";

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;
  const { method, headers } = context.request;

  // GET/HEAD: new Request() strips hop-by-hop headers (Connection, TE) automatically
  if (method === 'GET' || method === 'HEAD') {
    return fetch(new Request(target, { method, headers }));
  }

  const ct = context.request.headers.get('content-type') ?? '';
  const body = ct.includes('multipart/form-data')
    ? await context.request.arrayBuffer()
    : (await context.request.text()) || undefined;
  console.log(`[proxy] ${method} ${url.pathname}`);
  return fetch(new Request(target, { method, headers, body }));
};
