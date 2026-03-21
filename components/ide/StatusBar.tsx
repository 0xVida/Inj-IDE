import { GitBranch, Circle, Save } from "lucide-react";

interface StatusBarProps {
  language: string;
  line: number;
  col: number;
  network: string;
  unsavedCount?: number;
}

export function StatusBar({ language, line, col, network, unsavedCount = 0 }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between bg-primary px-2 md:px-3 py-0.5 text-primary-foreground text-[10px] md:text-[11px] font-mono">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span className="hidden sm:inline">main</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-current" />
          <span>{network}</span>
        </div>
        {unsavedCount > 0 && (
          <div className="flex items-center gap-1 text-primary-foreground/70">
            <Save className="h-2.5 w-2.5" />
            <span>{unsavedCount} unsaved</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <span>Ln {line}, Col {col}</span>
        <span className="hidden sm:inline">{language}</span>
        <span className="hidden md:inline">UTF-8</span>
      </div>
    </div>
  );
}
