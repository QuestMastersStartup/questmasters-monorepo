const WORKER_URL = "https://questmasters-api.questmastersstartup.workers.dev";

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;
  return fetch(new Request(target, context.request));
};
