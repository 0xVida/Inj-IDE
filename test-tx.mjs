import { TxGrpcApi } from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";
import util from "util";

async function run() {
  const endpoints = getNetworkEndpoints(Network.Testnet);
  const txApi = new TxGrpcApi(endpoints.grpc);
  const tx = await txApi.fetchTx("764E9A2C5957A2E3B8FE86180FCDEF8F03F696967AE3FBFB7C594FEE9F0997A7");
  console.log("logs array:", util.inspect(tx.logs, { depth: null }));
}
run();
