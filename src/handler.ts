import Big from "big.js";
import { BigNumber, providers, utils } from "ethers";
import { ERC20__factory, Multicall__factory } from "./contracts";
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

const { getAddress, defaultAbiCoder } = utils;
const TOTAL_SUPPLY: BigNumber = BigNumber.from("10000000000" + "0".repeat(16));


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
  const multicall = Multicall__factory.connect(MULTICALL_ADDRESS, rpcProvider);

  let circulatingSupply = TOTAL_SUPPLY;

  const callDatas: string[] = [];
  for (const entry of whitelist) {
    callDatas.push((await lina.populateTransaction.balanceOf(entry)).data!);
  }

  const multiCallData: string = (
    await multicall.populateTransaction.aggregate(
      callDatas.map((item) => {
        return {
          target: LINA_ADDRESS,
          callData: item,
        };
      })
    )
  ).data!;

  try {
    const response = await fetch(ETH_RPC, {
      method: "POST",
      body: JSON.stringify({
        method: "eth_call",
        params: [
          {
            from: MULTICALL_ADDRESS,
            to: MULTICALL_ADDRESS,
            value: "0x0",
            data: multiCallData,
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

    let blockNumber: BigNumber, returnData: string[];
    [blockNumber, returnData] = defaultAbiCoder.decode(
      ["uint256", "bytes[]"],
      body.result
    );

    returnData.forEach((item) => {
      circulatingSupply = circulatingSupply.sub(BigNumber.from(item));
    });
  } catch (ex) {
    return internalServerError();
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
