const WORKER_URL = "https://questmasters-api.questmastersstartup.workers.dev";

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;

  return fetch(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body ?? undefined,
  });
};
