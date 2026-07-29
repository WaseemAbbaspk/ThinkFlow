import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface SectionCardProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SectionCard({ title, count, defaultOpen = true, children }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            {count !== undefined && <Badge>{count}</Badge>}
          </div>
          <CollapsibleTrigger
            aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
            className="rounded-[6px] p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 transition-transform', !open && '-rotate-90')}
            />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-4">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
