export async function onRequest(){
  return new Response("ok\n", {status: 200, headers: {"content-type": "text/plain"}});
}
