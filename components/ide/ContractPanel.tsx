import { useState } from "react";
import { Rocket, Copy, ExternalLink } from "lucide-react";

interface ContractPanelProps {
  contractId: string | null;
  onInvoke: (fn: string, args: string) => void;
  onQuery: (fn: string, args: string) => void;
}

export function ContractPanel({ contractId, onInvoke, onQuery }: ContractPanelProps) {
  const [fnName, setFnName] = useState("SayHello");
  const [args, setArgs] = useState('{"name": "Dev"}');

  return (
    <div className="h-full bg-card flex flex-col">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        Interact
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 md:space-y-4">
        <div>
          <label className="text-[10px] md:text-xs text-muted-foreground font-mono block mb-1">Contract ID</label>
          {contractId ? (
            <div className="flex items-center gap-1">
              <code className="text-[10px] md:text-xs bg-muted px-2 py-1 rounded font-mono text-primary truncate flex-1">
                {contractId}
              </code>
              <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-[10px] md:text-xs text-muted-foreground/50 italic">No contract deployed</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] md:text-xs text-muted-foreground font-mono block">Function</label>
          <input
            type="text"
            value={fnName}
            onChange={(e) => setFnName(e.target.value)}
            className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="function_name"
          />
          <label className="text-[10px] md:text-xs text-muted-foreground font-mono block">Arguments (JSON)</label>
          <textarea
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            rows={2}
            className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            placeholder='["arg1", "arg2"]'
          />
          <div className="flex gap-2">
            <button
              onClick={() => onInvoke(fnName, args)}
              disabled={!contractId}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 cursor-pointer"
            >
              <Rocket className="h-3.5 w-3.5" />
              Execute
            </button>
            <button
              onClick={() => onQuery(fnName, args)}
              disabled={!contractId}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-30 cursor-pointer"
            >
              Query
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Resources</p>
          <a href="https://docs.injective.network" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] md:text-xs text-primary hover:underline cursor-pointer">
            <ExternalLink className="h-3 w-3" />
            Injective Docs
          </a>
          <a href="https://hub.injective.network" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] md:text-xs text-primary hover:underline cursor-pointer">
            <ExternalLink className="h-3 w-3" />
            Injective Hub
          </a>
        </div>
      </div>
    </div>
  );
}
