import { useState } from "react";
import { ChevronUp, ChevronDown, Terminal as TermIcon, AlertCircle, CheckCircle, Trash2 } from "lucide-react";

interface LogEntry {
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp: string;
}

interface TerminalProps {
  logs: LogEntry[];
  isExpanded: boolean;
  onToggle: () => void;
  onClear?: () => void;
}

export function Terminal({ logs, isExpanded, onToggle, onClear }: TerminalProps) {
  const colorMap = {
    info: "text-terminal-cyan",
    success: "text-terminal-green",
    error: "text-terminal-red",
    warning: "text-terminal-yellow",
  };

  const iconMap = {
    info: TermIcon,
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
  };

  return (
    <div className="h-full flex flex-col bg-terminal-bg border-t border-border">
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-2 md:px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors border-b border-border"
      >
        <div className="flex items-center gap-2">
          <TermIcon className="h-3.5 w-3.5" />
          <span className="font-semibold uppercase tracking-wider text-[10px] md:text-xs">Console</span>
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px]">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded && onClear && logs.length > 0 && (
            <span
              role="button"
              className="p-0.5 hover:bg-muted cursor-pointer rounded text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
            >
              <Trash2 className="h-3 w-3" />
            </span>
          )}
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </div>
      </button>
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {logs.length === 0 ? (
            <div className="text-muted-foreground/50 text-[10px] md:text-xs font-mono p-2">
              <span className="text-terminal-cyan">$</span> Ready. Compile a contract to see output...
              <span className="inline-block w-2 h-3.5 bg-foreground/70 ml-0.5 animate-blink" />
            </div>
          ) : (
            logs.map((log, i) => {
              const Icon = iconMap[log.type];
              return (
                <div key={i} className={`flex items-start gap-1.5 md:gap-2 text-[10px] md:text-xs font-mono py-0.5 ${colorMap[log.type]}`}>
                  <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">{log.timestamp}</span>
                  <Icon className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="break-all whitespace-pre-wrap">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export type { LogEntry };
