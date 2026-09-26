export const onRequestGet = async () => {
  return Response.json({
    ok: true,
    service: 'capcut-vietsub-studio',
    runtime: 'cloudflare-pages-functions',
    timestamp: new Date().toISOString(),
  });
};
