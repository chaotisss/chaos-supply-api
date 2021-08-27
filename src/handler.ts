export async function handleRequest(request: Request): Promise<Response> {
  return new Response("OK", {
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
