"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";
import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { PrivateKey, MsgBroadcasterWithPk } from "@injectivelabs/sdk-ts";

interface WalletContextType {
  address: string;
  isConnecting: boolean;
  disconnect: () => void;
  broadcast: (msgs: any) => Promise<any>;
  setPrivateKey: (key: string) => void;
  privateKey: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const network = Network.Testnet;
const endpoints = getNetworkEndpoints(network);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [privateKey, setPrivateKeyInternal] = useState<string>("");

  const setPrivateKey = useCallback((key: string, skipSave = false) => {
    if (!key) {
      setPrivateKeyInternal("");
      setAddress("");
      localStorage.removeItem("injective_pk");
      return;
    }

    try {
      setIsConnecting(true);
      const pk = PrivateKey.fromHex(key);
      const derivedAddress = pk.toBech32();
      setPrivateKeyInternal(key);
      setAddress(derivedAddress);
      if (!skipSave) {
        localStorage.setItem("injective_pk", key);
        toast.success("Wallet connected!");
      }
    } catch (error) {
      console.error("Invalid private key:", error);
      if (!skipSave) toast.error("Invalid private key format.");
      setPrivateKeyInternal("");
      setAddress("");
      localStorage.removeItem("injective_pk");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  React.useEffect(() => {
    const savedPk = localStorage.getItem("injective_pk");
    if (savedPk) {
      setPrivateKey(savedPk, true);
    }
  }, [setPrivateKey]);

  const disconnect = useCallback(() => {
    setAddress("");
    setPrivateKeyInternal("");
    localStorage.removeItem("injective_pk");
    toast.info("Wallet disconnected");
  }, []);

  const broadcast = useCallback(async (msgs: any) => {
    if (!address || !privateKey) throw new Error("Wallet not connected");

    try {
      console.log("Starting broadcast with msgs:", msgs);
      
      const broadcaster = new MsgBroadcasterWithPk({
        network,
        privateKey,
        endpoints,
        gasBufferCoefficient: 1.5
      });

      const messages = Array.isArray(msgs) ? msgs : [msgs];

      console.log(`Broadcasting from address: ${address}`);

      const response = await broadcaster.broadcast({ 
        msgs: messages
      });
      
      console.log("Broadcast response received:", response);
      
      if (!response || !response.txHash) {
        throw new Error("Deployment failed: transaction broadcaster returned an empty response.");
      }

      return response;
    } catch (error: any) {
      console.error("Broadcast error caught:", error);
      
      let errorMessage = error.message || "Unknown broadcast error";
      
      if (error.rawLog) {
        errorMessage = `${errorMessage}: ${error.rawLog}`;
      } else if (error.context?.rawLog) {
        errorMessage = `${errorMessage}: ${error.context.rawLog}`;
      } else if (typeof error === 'object' && error !== null) {
        try {
          const detail = JSON.stringify(error);
          if (detail.includes("raw_log")) {
            const match = detail.match(/"raw_log":"([^"]+)"/);
            if (match) errorMessage += `: ${match[1]}`;
          }
        } catch (e) {}
      }
      
      throw new Error(errorMessage);
    }
  }, [address, privateKey]);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnecting,
        disconnect,
        broadcast,
        setPrivateKey,
        privateKey,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
