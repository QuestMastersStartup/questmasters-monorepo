const WORKER_URL = "https://questmasters-api.questmastersstartup.workers.dev";

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;
  const method = context.request.method;

  // Read body as text first — avoids ReadableStream transfer issues in Pages Functions
  const bodyText = !['GET', 'HEAD'].includes(method)
    ? await context.request.text()
    : undefined;

  console.log(`[proxy] ${method} ${url.pathname} body_len=${bodyText?.length ?? 0}`);

  return fetch(target, {
    method,
    headers: context.request.headers,
    body: bodyText || undefined,
  });
};
