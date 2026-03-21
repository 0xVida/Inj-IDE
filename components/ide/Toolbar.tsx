import { 
  Play, Upload, TestTube, Settings, Network, Menu, X, 
  Wallet as WalletIcon, LogOut, ChevronDown, Check, 
  Plus, RefreshCw, ExternalLink, Copy, AlertCircle, Save 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "sonner";

interface ToolbarProps {
  onCompile: () => void;
  onDeploy: () => void;
  onTest: () => void;
  isCompiling: boolean;
  isDeploying: boolean;
  network: string;
  onNetworkChange: (network: string) => void;
  onSave?: () => void;
  saveStatus?: string;
}

export function Toolbar({ onCompile, onDeploy, onTest, onSave, isCompiling, isDeploying, network, onNetworkChange, saveStatus }: ToolbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const { address, disconnect, isConnecting, setPrivateKey, privateKey } = useWallet();
  const [tempPk, setTempPk] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  const handleConnect = () => {
    if (!tempPk) {
      toast.error("Please enter a private key");
      return;
    }
    setPrivateKey(tempPk);
    setTempPk("");
    setShowWalletMenu(false);
  };

  const generateWallet = () => {
    const chars = "0123456789abcdef";
    let pk = "";
    for (let i = 0; i < 64; i++) pk += chars[Math.floor(Math.random() * 16)];
    setPrivateKey(pk);
    toast.success("New wallet generated and connected!");
    setShowWalletMenu(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const renderWalletManager = () => (
    <>
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-xs font-bold text-foreground">Local Wallet Manager</h3>
        <p className="text-[10px] text-muted-foreground">In-app wallet for developers</p>
      </div>

      <div className="p-4 space-y-4">
        {address ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Connected Address</span>
                <button onClick={() => copyToClipboard(address)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="text-[11px] font-mono break-all text-foreground bg-background/50 p-2 rounded border border-border/50">
                {address}
              </div>
            </div>

            <div className="flex gap-2">
              <a 
                href="https://testnet.faucet.injective.network/" 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-semibold rounded-lg bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-all"
              >
                <ExternalLink className="h-3 w-3" />
                Faucet
              </a>
              <button 
                onClick={disconnect}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-semibold rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all text-destructive"
              >
                <LogOut className="h-3 w-3 text-destructive" />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Private Key</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter 0x... or plain hex"
                  value={tempPk}
                  onChange={(e) => setTempPk(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                />
                <button 
                  onClick={handleConnect}
                  className="absolute right-2 top-1.5 p-1 rounded hover:bg-primary/20 text-primary transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" /> Your key stays in your browser
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <button
              onClick={generateWallet}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Generate New Wallet
            </button>

            <a
              href="https://testnet.faucet.injective.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors py-1 underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Get Testnet Funds
            </a>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="bg-toolbar-bg border-b border-border sticky top-0 z-40">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-4 border-r border-border">
            <img src="/icon.png" alt="Logo" className="h-6 w-6 object-contain" />
            <span className="text-primary font-bold text-sm tracking-tight font-mono">Injective IDE</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onCompile}
              disabled={isCompiling}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm">
              <Play className={`h-3.5 w-3.5 ${isCompiling ? "animate-pulse" : ""}`} />
              {isCompiling ? "Compiling..." : "Compile"}
            </button>
            <button
              onClick={onDeploy}
              disabled={isDeploying || !address}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-accent text-white hover:bg-accent/80 disabled:opacity-50 transition-all shadow-sm">
              <Upload className={`h-3.5 w-3.5 ${isDeploying ? "animate-bounce" : ""}`} />
              {isDeploying ? "Deploying..." : "Deploy"}
            </button>
            <button
              onClick={onTest}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
              <TestTube className="h-3.5 w-3.5" />
              Test
            </button>
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50">
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          </div>

          {saveStatus &&
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/50 animate-in fade-in slide-in-from-left-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground font-mono">
                {saveStatus}
              </span>
            </div>
          }
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-md px-2 py-1 border border-border/50">
            <Network className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={network}
              onChange={(e) => onNetworkChange(e.target.value)}
              className="bg-transparent border-none text-[11px] font-medium text-foreground focus:outline-none focus:ring-0 cursor-pointer">
              <option value="injective-testnet">Injective Testnet</option>
              <option value="injective-mainnet">Injective Mainnet</option>
              <option value="injective-devnet">Injective Devnet</option>
              <option value="local">Local Node</option>
            </select>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                address 
                  ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
                  : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <WalletIcon className="h-3.5 w-3.5" />
              {address ? truncateAddress(address) : "Sign In"}
              <ChevronDown className={`h-3 w-3 transition-transform ${showWalletMenu ? "rotate-180" : ""}`} />
            </button>

            {showWalletMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {renderWalletManager()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Logo" className="h-5 w-5 object-contain" />
          <span className="text-primary font-bold text-sm tracking-tight font-mono">Inj IDE</span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus &&
            <div className="w-2 h-2 rounded-full bg-green-500" />
          }
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-muted-foreground hover:text-foreground">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen &&
        <div className="md:hidden flex flex-col gap-2 p-3 border-t border-border bg-card animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onCompile(); setMobileMenuOpen(false); }}
              disabled={isCompiling}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg bg-primary text-white">
              <Play className="h-3.5 w-3.5" />
              {isCompiling ? "Compiling..." : "Compile"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => { onDeploy(); setMobileMenuOpen(false); }}
                disabled={isDeploying || !address}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg bg-accent text-white">
                <Upload className="h-3.5 w-3.5" />
                {isDeploying ? "Deploying" : "Deploy"}
              </button>
              <button
                onClick={() => { onTest(); setMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg bg-secondary text-foreground">
                <TestTube className="h-3.5 w-3.5" />
                Test
              </button>
              <button
                onClick={() => { onSave?.(); setMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg bg-muted text-foreground border border-border/50">
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
          
          <div className="h-px bg-border my-1" />

          <button
            onClick={() => { setShowWalletMenu(!showWalletMenu); }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg border ${
              address ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <WalletIcon className="h-4 w-4" />
            {address ? truncateAddress(address) : "Sign In"}
          </button>

          {showWalletMenu && (
             <div className="mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in duration-200">
                {renderWalletManager()}
             </div>
          )}
        </div>
      }
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);