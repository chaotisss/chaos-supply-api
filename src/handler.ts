import Big from "big.js";
import { BigNumber, providers, utils } from "ethers";
import { ERC20__factory } from "./contracts";
import { Router } from "./router";
import {
  badRequest,
  doBasicAuth,
  getWhitelistKey,
  internalServerError,
  json,
  ok,
  unauthorized,
} from "./utils";

const { getAddress } = utils;

const TOTAL_SUPPLY: BigNumber = BigNumber.from("10000000000" + "0".repeat(18));

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

const handleGetCirculatingSupply = async (
  request: Request,
  match: RegExpMatchArray
): Promise<Response> => {
  const whitelist = await getWhitelistFromStorage();

  const rpcProvider = new providers.JsonRpcProvider();
  const lina = ERC20__factory.connect(LINA_ADDRESS, rpcProvider);

  let circulatingSupply = TOTAL_SUPPLY;

  for (const entry of whitelist) {
    const balanceOfData = (await lina.populateTransaction.balanceOf(entry))
      .data;

    try {
      const response = await fetch(ETH_RPC, {
        method: "POST",
        body: JSON.stringify({
          method: "eth_call",
          params: [
            {
              from: entry,
              to: LINA_ADDRESS,
              value: "0x0",
              data: balanceOfData,
            },
            "latest",
          ],
          id: 1,
          jsonrpc: "2.0",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const body = await response.json();
      if (body.error) {
        throw new Error("JSON RPC request error");
      }

      const currentAddressBalance = BigNumber.from(body.result);
      circulatingSupply = circulatingSupply.sub(currentAddressBalance);
    } catch (ex) {
      return internalServerError();
    }
  }

  return new Response(
    new Big(circulatingSupply.toString())
      .div(new Big("1" + "0".repeat(18)))
      .toString(),
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    }
  );
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
  router.get(/^\/circulatingSupply$/, handleGetCirculatingSupply);

  return await router.route(request);
}
