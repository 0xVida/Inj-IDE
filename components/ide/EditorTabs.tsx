import { X, Circle } from "lucide-react";

export interface TabInfo {
  path: string[];
  name: string;
  unsaved?: boolean;
}

interface EditorTabsProps {
  tabs: TabInfo[];
  activeTab: string;
  onTabSelect: (path: string[]) => void;
  onTabClose: (path: string[]) => void;
}

export function EditorTabs({ tabs, activeTab, onTabSelect, onTabClose }: EditorTabsProps) {
  return (
    <div className="flex bg-secondary border-b border-border overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const key = tab.path.join("/");
        const isActive = key === activeTab;
        return (
          <button
            key={key}
            className={`group flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 text-[11px] md:text-xs font-mono border-r border-border cursor-pointer transition-colors min-w-0 shrink-0 ${
              isActive
                ? "bg-tab-active text-foreground border-t-2 border-t-primary"
                : "bg-tab-inactive text-muted-foreground hover:bg-tab-hover border-t-2 border-t-transparent"
            }`}
            onClick={() => onTabSelect(tab.path)}
          >
            {tab.unsaved && (
              <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
            )}
            <span className="truncate max-w-[80px] md:max-w-none">{tab.name}</span>
            <span
              role="button"
              className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted cursor-pointer transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.path);
              }}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
