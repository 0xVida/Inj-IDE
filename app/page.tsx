"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { EditorTabs, TabInfo } from "@/components/ide/EditorTabs";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { Terminal, LogEntry } from "@/components/ide/Terminal";
import { Toolbar } from "@/components/ide/Toolbar";
import { ContractPanel } from "@/components/ide/ContractPanel";
import { StatusBar } from "@/components/ide/StatusBar";
import { sampleContracts, FileNode } from "@/lib/sample-contracts";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FolderTree,
  Rocket,
  FileText,
  Terminal as TerminalIcon,
} from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from "react-resizable-panels";
import { useWallet } from "@/context/WalletContext";
import { MsgStoreCode, MsgInstantiateContract, MsgExecuteContractCompat, ChainGrpcWasmApi, TxGrpcApi } from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";

const cloneFiles = (files: FileNode[]): FileNode[] =>
  JSON.parse(JSON.stringify(files));

const findNode = (nodes: FileNode[], pathParts: string[]): FileNode | null => {
  for (const node of nodes) {
    if (node.name === pathParts[0]) {
      if (pathParts.length === 1) return node;
      if (node.children) return findNode(node.children, pathParts.slice(1));
    }
  }
  return null;
};

const findParent = (nodes: FileNode[], pathParts: string[]): FileNode[] | null => {
  if (pathParts.length <= 1) return nodes;
  const parent = findNode(nodes, pathParts.slice(0, -1));
  return parent?.children ?? null;
};

export default function Home() {
  const [files, setFiles] = useState<FileNode[]>(() => cloneFiles(sampleContracts));
  const [openTabs, setOpenTabs] = useState<TabInfo[]>([
    { path: ["injective-vault", "src", "lib.rs"], name: "lib.rs" },
  ]);
  const [activeTabPath, setActiveTabPath] = useState<string[]>(["injective-vault", "src", "lib.rs"]);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [network, setNetwork] = useState("injective-testnet");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [wasmBase64, setWasmBase64] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const { address, broadcast } = useWallet();
  const [showExplorer, setShowExplorer] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [unsavedFiles, setUnsavedFiles] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"none" | "explorer" | "interact">("none");

  const explorerPanelRef = useRef<ImperativePanelHandle>(null);
  const interactPanelRef = useRef<ImperativePanelHandle>(null);

  const savedContentRef = useRef<Record<string, string>>({});
  
  useEffect(() => {
    const init = (nodes: FileNode[], path: string[]) => {
      for (const node of nodes) {
        const p = [...path, node.name].join("/");
        if (node.type === "file" && node.content) {
          savedContentRef.current[p] = node.content;
        }
        if (node.children) init(node.children, [...path, node.name]);
      }
    };
    init(files, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    if (mq.matches) {
      setShowExplorer(true);
      setShowPanel(true);
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setShowExplorer(true);
        setShowPanel(true);
      } else {
        setShowExplorer(false);
        setShowPanel(false);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const getTimestamp = () => new Date().toLocaleTimeString("en-US", { hour12: false });

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: getTimestamp() }]);
  }, []);

  const handleFileSelect = useCallback((path: string[], file: FileNode) => {
    if (file.type !== "file") return;
    const key = path.join("/");
    setActiveTabPath(path);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.path.join("/") === key)) return prev;
      return [...prev, { path, name: file.name }];
    });
    setMobilePanel("none");
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    const key = activeTabPath.join("/");
    setFiles((prev) => {
      const next = cloneFiles(prev);
      const node = findNode(next, activeTabPath);
      if (node) node.content = newContent;
      return next;
    });

    if (newContent !== savedContentRef.current[key]) {
      setUnsavedFiles((prev) => new Set(prev).add(key));
    } else {
      setUnsavedFiles((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [activeTabPath]);

  const handleSave = useCallback(() => {
    const key = activeTabPath.join("/");
    const node = findNode(files, activeTabPath);
    if (node && node.content !== undefined) {
      savedContentRef.current[key] = node.content;
      setUnsavedFiles((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setSaveStatus("Saved");
      addLog("success", `Saved ${node.name}`);
      setTimeout(() => setSaveStatus(""), 2000);
    }
  }, [activeTabPath, files, addLog]);

  const handleTabClose = useCallback((path: string[]) => {
    const pathStr = path.join("/");
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.path.join("/") !== pathStr);
      if (activeTabPath.join("/") === pathStr && next.length > 0) {
        setActiveTabPath(next[next.length - 1].path);
      }
      return next;
    });
  }, [activeTabPath]);

  const handleCreateFile = useCallback((parentPath: string[], name: string) => {
    const newContent = name.endsWith(".rs")
      ? `use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdResult, Binary};\n\n#[entry_point]\npub fn instantiate(\n    _deps: DepsMut,\n    _env: Env,\n    _info: MessageInfo,\n    _msg: Binary,\n) -> StdResult<Response> {\n    Ok(Response::new().add_attribute("action", "instantiate"))\n}\n`
      : "";
    setFiles((prev) => {
      const next = cloneFiles(prev);
      const parent = parentPath.length === 0 ? next : findNode(next, parentPath)?.children;
      if (parent) {
        parent.push({
          name,
          type: "file",
          language: name.endsWith(".rs") ? "rust" : name.endsWith(".toml") ? "toml" : "text",
          content: newContent,
        });
      }
      return next;
    });
    const newPath = [...parentPath, name];
    const key = newPath.join("/");
    savedContentRef.current[key] = newContent;
    setActiveTabPath(newPath);
    setOpenTabs((prev) => [...prev, { path: newPath, name }]);
  }, []);

  const handleCreateFolder = useCallback((parentPath: string[], name: string) => {
    setFiles((prev) => {
      const next = cloneFiles(prev);
      const parent = parentPath.length === 0 ? next : findNode(next, parentPath)?.children;
      if (parent) {
        parent.push({ name, type: "folder", children: [] });
      }
      return next;
    });
  }, []);

  const handleDeleteNode = useCallback((path: string[]) => {
    setFiles((prev) => {
      const next = cloneFiles(prev);
      const parent = findParent(next, path);
      if (parent) {
        const idx = parent.findIndex((n) => n.name === path[path.length - 1]);
        if (idx !== -1) parent.splice(idx, 1);
      }
      return next;
    });
    const key = path.join("/");
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.path.join("/") !== key);
      if (activeTabPath.join("/") === key && next.length > 0) {
        setActiveTabPath(next[next.length - 1].path);
      }
      return next;
    });
  }, [activeTabPath]);

  const handleRenameNode = useCallback((path: string[], newName: string) => {
    const oldKey = path.join("/");
    const newPath = [...path.slice(0, -1), newName];
    const newKey = newPath.join("/");

    setFiles((prev) => {
      const next = cloneFiles(prev);
      const node = findNode(next, path);
      if (node) node.name = newName;
      return next;
    });

    setOpenTabs((prev) =>
      prev.map((t) => {
        const tKey = t.path.join("/");
        if (tKey === oldKey || tKey.startsWith(oldKey + "/")) {
          const updated = [...newPath, ...t.path.slice(path.length)];
          return { ...t, path: updated, name: updated[updated.length - 1] };
        }
        return t;
      })
    );

    if (activeTabPath.join("/") === oldKey) {
      setActiveTabPath(newPath);
    }
  }, [activeTabPath]);

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    addLog("info", "Starting Injective CosmWasm compilation...");

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "injective-vault",
          files: files,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addLog("success", "Compilation finished successfully!");
        if (result.wasmGenerated && result.wasmBase64) {
          setWasmBase64(result.wasmBase64);
          addLog("info", "WASM artifact generated and ready for deployment.");
        }
      } else {
        addLog("error", "Compilation failed!");
        if (result.error) addLog("error", result.error);
        if (result.output && !result.error) addLog("info", result.output);
      }
    } catch (error: any) {
      addLog("error", `Request failed: ${error.message}`);
    } finally {
      setIsCompiling(false);
    }
  }, [files, addLog]);

  const handleDeploy = useCallback(async () => {
    if (!address) {
      addLog("error", "Please connect your wallet first.");
      return;
    }
    if (!wasmBase64) {
      addLog("error", "No compiled WASM found. Please compile first.");
      return;
    }

    setIsDeploying(true);
    addLog("info", `Initiating deployment to ${network}...`);
    addLog("info", "Storing WASM code on-chain...");

    try {
      const binaryString = window.atob(wasmBase64);
      const wasmBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        wasmBytes[i] = binaryString.charCodeAt(i);
      }

      const storeMsg = MsgStoreCode.fromJSON({
        sender: address,
        wasmBytes: wasmBytes,
      });

      addLog("info", "Broadcasting StoreCode transaction...");
      const storeRes = await broadcast(storeMsg);
      const storeTxHash = storeRes.txHash;
      addLog("success", `Code stored! Tx Hash: ${storeTxHash}`);

      let codeId = "";
      const endpoints = getNetworkEndpoints(Network.Testnet);
      const txApi = new TxGrpcApi(endpoints.grpc);
      
      try {
        const txStore = await txApi.fetchTx(storeTxHash);
        if (txStore && txStore.events) {
          const storeEvent = txStore.events.find((e: any) => e.type === "store_code");
          const attr = storeEvent?.attributes?.find((a: any) => a.key === "code_id");
          if (attr) {
            codeId = attr.value;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch tx from grpc:", e);
      }

      if (!codeId && storeRes.rawLog) {
        try {
          const logs = JSON.parse(storeRes.rawLog);
          for (const log of logs) {
            const storeEvent = log.events?.find((e: any) => e.type === "store_code");
            const attr = storeEvent?.attributes?.find((a: any) => a.key === "code_id");
            if (attr) {
              codeId = attr.value;
              break;
            }
          }
        } catch (e) {
          console.warn("Could not parse store_code logs:", e);
        }
      }

      if (!codeId) throw new Error("Code ID not found in transaction logs.");
      addLog("success", `Retrieved Code ID: ${codeId}`);

      const initMsgStr = prompt("Enter Instantiation JSON for the contract:", '{}');
      if (initMsgStr === null) {
        addLog("error", "Deployment cancelled by user.");
        setIsDeploying(false);
        return;
      }

      let parsedInitMsg = {};
      try {
        parsedInitMsg = JSON.parse(initMsgStr);
      } catch (e) {
        addLog("error", "Invalid JSON format for Instantiation Message.");
        setIsDeploying(false);
        return;
      }

      addLog("info", `Instantiating contract with message: ${initMsgStr}`);
      const instantiateMsg = MsgInstantiateContract.fromJSON({
        sender: address,
        admin: address,
        codeId: parseInt(codeId),
        label: `Vault-${Date.now()}`,
        msg: parsedInitMsg,
      });

      const instantiateRes = await broadcast(instantiateMsg);
      const instantiateTxHash = instantiateRes.txHash;
      addLog("success", `Instantiation broadcasted! Tx Hash: ${instantiateTxHash}`);

      let contractAddress = "";
      try {
        const txInst = await txApi.fetchTx(instantiateTxHash);
        if (txInst && txInst.events) {
          const instEvent = txInst.events.find((e: any) => e.type === "instantiate");
          const attr = instEvent?.attributes?.find((a: any) => a.key === "_contract_address");
          if (attr) {
            contractAddress = attr.value;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch inst tx from grpc:", e);
      }

      if (!contractAddress && instantiateRes.rawLog) {
        try {
          const logs = JSON.parse(instantiateRes.rawLog);
          for (const log of logs) {
            const instEvent = log.events?.find((e: any) => e.type === "instantiate");
            const attr = instEvent?.attributes?.find((a: any) => a.key === "_contract_address");
            if (attr) {
              contractAddress = attr.value;
              break;
            }
          }
        } catch (e) {
          console.warn("Could not parse instantiate logs:", e);
        }
      }

      if (!contractAddress) throw new Error("Contract address not found in logs.");
      
      addLog("success", `Contract instantiated at: ${contractAddress}`);
      setContractId(contractAddress);
      setShowPanel(true);
    } catch (error: any) {
      console.error("Deployment error:", error);
      addLog("error", `Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  }, [address, wasmBase64, broadcast, addLog, network]);

  const handleTest = useCallback(async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    addLog("info", "Starting Injective CosmWasm contract tests...");
    
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "injective-vault",
          files: files,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addLog("success", "Tests finished successfully!");
        if (result.output) addLog("info", result.output);
      } else {
        addLog("error", "Tests failed!");
        if (result.error) addLog("error", result.error);
        if (result.output && !result.error) addLog("info", result.output);
      }
    } catch (err: any) {
      addLog("error", `Test execution failed: ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  }, [files, isCompiling, addLog]);

  const handleInvoke = useCallback(async (method: string, args: string) => {
    if (!address || !contractId) {
      addLog("error", "Please deploy and connect wallet first.");
      return;
    }
    
    addLog("info", `Executing ${method} with args: ${args}...`);

    try {
      const parsedArgs = JSON.parse(args);
      const msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: contractId,
        sender: address,
        msg: { [method]: parsedArgs }
      });

      const res = await broadcast(msg);
      addLog("success", `Execution successful! Tx Hash: ${res.txHash}`);
    } catch (error: any) {
      console.error("Invoke error:", error);
      addLog("error", `Execution failed: ${error.message}`);
    }
  }, [address, contractId, broadcast, addLog]);

  const handleQuery = useCallback(async (method: string, args: string) => {
    if (!contractId) {
      addLog("error", "Please deploy a contract first.");
      return;
    }

    addLog("info", `Querying ${method} with args: ${args}...`);

    try {
      const parsedArgs = JSON.parse(args);
      const endpoints = getNetworkEndpoints(Network.Testnet);
      const wasmApi = new ChainGrpcWasmApi(endpoints.grpc);
      
      const queryMsg = { [method]: parsedArgs };
      const response = await wasmApi.fetchSmartContractState(
        contractId,
        Buffer.from(JSON.stringify(queryMsg)).toString("base64")
      );

      const decodedResponse = Buffer.from(response.data as any, "base64").toString();
      addLog("success", `Query response: ${decodedResponse}`);
    } catch (error: any) {
      console.error("Query error:", error);
      addLog("error", `Query failed: ${error.message}`);
    }
  }, [contractId, addLog]);

  const activeFile = findNode(files, activeTabPath);
  const content = activeFile?.content ?? "";
  const language = activeFile?.language ?? "rust";

  const tabsWithStatus = openTabs.map(t => ({
    ...t,
    unsaved: unsavedFiles.has(t.path.join("/"))
  }));

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <Toolbar
        onCompile={handleCompile}
        onDeploy={handleDeploy}
        onTest={handleTest}
        onSave={handleSave}
        isCompiling={isCompiling}
        isDeploying={isDeploying}
        network={network}
        onNetworkChange={setNetwork}
        saveStatus={saveStatus}
      />

      <div className="flex-1 overflow-hidden relative">
        <div className="hidden md:flex h-full overflow-hidden">
          {!showExplorer && (
            <div className="w-10 flex flex-col items-center py-4 bg-sidebar border-r border-border gap-4 shrink-0 h-full">
              <button
                onClick={() => {
                  setShowExplorer(true);
                  explorerPanelRef.current?.expand();
                }}
                className="p-2 text-muted-foreground hover:text-primary cursor-pointer transition-colors hover:bg-muted rounded"
                title="Show Explorer"
              >
                <FolderTree className="h-5 w-5" />
              </button>
            </div>
          )}

          <PanelGroup direction="horizontal">
            <Panel
              ref={explorerPanelRef}
              defaultSize={20}
              minSize={15}
              maxSize={40}
              collapsible={true}
              onCollapse={() => setShowExplorer(false)}
              onExpand={() => setShowExplorer(true)}
              className={`${showExplorer ? "flex" : "hidden"} bg-sidebar overflow-hidden h-full flex-col`}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-sidebar shrink-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Explorer</span>
                <button
                  onClick={() => {
                    setShowExplorer(false);
                    explorerPanelRef.current?.collapse();
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <FileExplorer
                  files={files}
                  onFileSelect={handleFileSelect}
                  activeFilePath={activeTabPath}
                  onCreateFile={handleCreateFile}
                  onCreateFolder={handleCreateFolder}
                  onDeleteNode={handleDeleteNode}
                  onRenameNode={handleRenameNode}
                />
              </div>
            </Panel>

            <PanelResizeHandle className={`${showExplorer ? "flex" : "hidden"} w-1 bg-border/20 hover:bg-primary/40 cursor-pointer transition-colors cursor-col-resize z-50 self-stretch pointer-events-auto`} />

            <Panel className="flex flex-col min-w-0 h-full">
              <PanelGroup direction="vertical">
                <Panel defaultSize={75} minSize={30}>
                  <div className="h-full flex flex-col">
                    <EditorTabs
                      tabs={tabsWithStatus}
                      activeTab={activeTabPath.join("/")}
                      onTabSelect={setActiveTabPath}
                      onTabClose={handleTabClose}
                    />
                    <div className="flex-1 overflow-hidden">
                      <CodeEditor
                        content={content}
                        language={language}
                        fileName={activeFile?.name}
                        onChange={handleContentChange}
                        onCursorChange={(line, col) => setCursorPos({ line, col })}
                        onSave={handleSave}
                      />
                    </div>
                  </div>
                </Panel>

                {terminalExpanded && (
                  <>
                    <PanelResizeHandle className="h-1 bg-border/20 hover:bg-primary/40 cursor-pointer transition-colors cursor-row-resize relative z-50 self-stretch pointer-events-auto" />
                    <Panel defaultSize={25} minSize={10} collapsible={true} onCollapse={() => setTerminalExpanded(false)}>
                      <Terminal
                        logs={logs}
                        isExpanded={true}
                        onToggle={() => setTerminalExpanded(false)}
                        onClear={() => setLogs([])}
                      />
                    </Panel>
                  </>
                )}
              </PanelGroup>

              {!terminalExpanded && (
                <div className="bg-terminal-bg border-t border-border shrink-0">
                  <button
                    onClick={() => setTerminalExpanded(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors w-full text-left"
                  >
                    <TerminalIcon className="h-3.5 w-3.5" />
                    <span className="font-semibold uppercase tracking-wider">Console</span>
                  </button>
                </div>
              )}
            </Panel>

            <PanelResizeHandle className={`${showPanel ? "flex" : "hidden"} w-1 bg-border/20 hover:bg-primary/40 cursor-pointer transition-colors cursor-col-resize z-50 self-stretch pointer-events-auto`} />

            <Panel
              ref={interactPanelRef}
              defaultSize={20}
              minSize={15}
              maxSize={35}
              collapsible={true}
              onCollapse={() => setShowPanel(false)}
              onExpand={() => setShowPanel(true)}
              className={`${showPanel ? "flex" : "hidden"} bg-card h-full flex-col`}
            >
              <div className="h-full flex flex-col relative">
                <button
                  onClick={() => {
                    setShowPanel(false);
                    interactPanelRef.current?.collapse();
                  }}
                  className="absolute top-2 right-2 z-10 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer transition-colors"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
                <ContractPanel contractId={contractId} onInvoke={handleInvoke} onQuery={handleQuery} />
              </div>
            </Panel>
          </PanelGroup>

          {!showPanel && (
            <div className="w-10 flex flex-col items-center py-4 bg-card border-l border-border gap-4 shrink-0 h-full">
              <button
                onClick={() => {
                  setShowPanel(true);
                  interactPanelRef.current?.expand();
                }}
                className="p-2 text-muted-foreground hover:text-primary cursor-pointer transition-colors hover:bg-muted rounded"
                title="Show Interact"
              >
                <Rocket className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <div className="md:hidden h-full flex flex-col overflow-hidden">
          {mobilePanel === "explorer" && (
            <div className="flex-1 overflow-hidden bg-sidebar flex flex-col">
              <div className="px-3 py-2 border-b border-border"><span className="text-[10px] font-semibold text-muted-foreground uppercase">Explorer</span></div>
              <div className="flex-1 overflow-y-auto">
                <FileExplorer files={files} onFileSelect={handleFileSelect} activeFilePath={activeTabPath} onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder} onDeleteNode={handleDeleteNode} onRenameNode={handleRenameNode} />
              </div>
            </div>
          )}
          {mobilePanel === "none" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <EditorTabs tabs={tabsWithStatus} activeTab={activeTabPath.join("/")} onTabSelect={setActiveTabPath} onTabClose={handleTabClose} />
              <div className="flex-1 overflow-hidden">
                <CodeEditor content={content} language={language} fileName={activeFile?.name} onChange={handleContentChange} onCursorChange={(line, col) => setCursorPos({ line, col })} onSave={handleSave} />
              </div>
            </div>
          )}
          {mobilePanel === "interact" && (
            <div className="flex-1 overflow-auto bg-card">
              <ContractPanel contractId={contractId} onInvoke={handleInvoke} onQuery={handleQuery} />
            </div>
          )}
          {terminalExpanded && (
            <div className="h-1/3 border-t border-border shrink-0 z-50 flex flex-col">
              <Terminal logs={logs} isExpanded={true} onToggle={() => setTerminalExpanded(false)} onClear={() => setLogs([])} />
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block">
        <StatusBar
          language={language}
          line={cursorPos.line}
          col={cursorPos.col}
          network={network}
          unsavedCount={unsavedFiles.size}
        />
      </div>

      <div className="md:hidden flex flex-col border-t border-border bg-sidebar px-3 py-1">
        <div className="flex items-center justify-between py-1 mb-1 border-b border-border/50">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
            {unsavedFiles.size > 0 && <span className="text-warning">{unsavedFiles.size} unsaved</span>}
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{network}</span>
        </div>
        <div className="flex items-stretch gap-2 pb-1">
          <button
            onClick={() => setMobilePanel(mobilePanel === "explorer" ? "none" : "explorer")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium cursor-pointer transition-colors ${mobilePanel === "explorer" ? "text-primary" : "text-muted-foreground"}`}
          >
            <FolderTree className="h-4 w-4" /> Explorer
          </button>
          <button
            onClick={() => setMobilePanel("none")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium cursor-pointer transition-colors ${mobilePanel === "none" ? "text-primary" : "text-muted-foreground"}`}
          >
            <FileText className="h-4 w-4" /> Editor
          </button>
          <button
            onClick={() => setMobilePanel(mobilePanel === "interact" ? "none" : "interact")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium cursor-pointer transition-colors ${mobilePanel === "interact" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Rocket className="h-4 w-4" /> Interact
          </button>
          <button
            onClick={() => setTerminalExpanded(!terminalExpanded)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium cursor-pointer transition-colors ${terminalExpanded ? "text-primary" : "text-muted-foreground"}`}
          >
            <TerminalIcon className="h-4 w-4" /> Console
          </button>
        </div>
      </div>
    </div>
  );
}
