export default defineEventHandler((event) => {
  const headers = getRequestHeaders(event);
  const host = (headers['x_umc_openai_host'] || 'http://172.16.128.9:3003').replace(/\/$/, '');

  console.log("UMC: ", { host});
  event.context.umc = { host}
})
