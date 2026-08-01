import React from 'react';
import { Copy, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface InspectorProps {
  id: string;
  title: string;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  children: React.ReactNode;
}

export function Inspector({ id, title, onClose, onDelete, onDuplicate, children }: InspectorProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[8px] border border-border bg-card">
      <div className="flex items-start gap-2 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <Badge className="mb-2">{id}</Badge>
          <h2 className="truncate text-base font-semibold">{title || id}</h2>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close details" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>

      {/* Names are scoped to the id on purpose: a bare "Delete" would collide with
          the confirm dialog's own Delete button, which tests match as /^delete$/i. */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {onDuplicate && (
          <Button variant="ghost" size="sm" aria-label={`Duplicate ${id}`} onClick={onDuplicate}>
            <Copy aria-hidden="true" />
            <span aria-hidden="true">Duplicate</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete ${id}`}
          className="text-muted-foreground hover:text-warn"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
          <span aria-hidden="true">Delete</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
