import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface StageTab { value: string; label: string; count?: number; }

export interface StageTabsProps {
  tabs: StageTab[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function StageTabs({ tabs, value, onValueChange, children }: StageTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="flex min-h-0 flex-1 flex-col">
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
