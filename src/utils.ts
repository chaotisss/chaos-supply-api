export const getWhitelistKey = (): string => "whitelist";

export const doBasicAuth = (request: Request): boolean => {
  const authHeader: string | null = request.headers.get("Authorization");
  if (authHeader === null) return false;

  const basicMatch: RegExpMatchArray | null =
    authHeader.match(/^Basic (?<token>.*)$/);
  if (
    basicMatch === null ||
    basicMatch.groups === undefined ||
    !basicMatch.groups.token
  )
    return false;

  const decodedToken = atob(basicMatch.groups.token);
  return decodedToken === ADMIN_TOKEN;
};

export const badRequest = () => {
  return new Response("Bad Request", {
    status: 400,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain",
    },
  });
};

export const unauthorized = () => {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain",
    },
  });
};

export const notFound = () => {
  return new Response("Not Found", {
    status: 404,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain",
    },
  });
};

export const ok = () => {
  return new Response("OK", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain",
    },
  });
};

export const json = (obj: any) => {
  return new Response(JSON.stringify(obj), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
};

export const internalServerError = () => {
  return new Response("Internal Server Error", {
    status: 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain",
    },
  });
};
