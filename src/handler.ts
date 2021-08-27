import { utils } from "ethers";
import { Router } from "./router";
import {
  badRequest,
  doBasicAuth,
  getWhitelistKey,
  json,
  ok,
  unauthorized,
} from "./utils";

const { getAddress } = utils;

const getWhitelistFromStorage = async (): Promise<string[]> => {
  const whitelist: string[] = JSON.parse(await STORAGE.get(getWhitelistKey()));
  return whitelist ? whitelist : [];
};

const handleSetWhitelist = async (
  request: Request,
  match: RegExpMatchArray
): Promise<Response> => {
  if (!doBasicAuth(request)) return unauthorized();

  let bodyList: (string | undefined | null)[];
  try {
    bodyList = await request.json();
    if (!Array.isArray(bodyList)) throw new Error("Invalid body");
  } catch {
    return badRequest();
  }

  const cleanList: string[] = [];

  for (const entry of bodyList) {
    try {
      if (!entry || entry !== getAddress(entry))
        throw new Error("Invalid address");
    } catch {
      return badRequest();
    }

    cleanList.push(entry);
  }

  await STORAGE.put(getWhitelistKey(), JSON.stringify(cleanList));

  return ok();
};

const handleGetWhitelist = async (
  request: Request,
  match: RegExpMatchArray
): Promise<Response> => {
  if (!doBasicAuth(request)) return unauthorized();

  return json(await getWhitelistFromStorage());
};

export async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const router = new Router();

  router.post(/^\/whitelist$/, handleSetWhitelist);
  router.get(/^\/whitelist$/, handleGetWhitelist);

  return await router.route(request);
}
