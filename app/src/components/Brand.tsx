export function Brand() {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border pb-3">
      {/* The collapsed rail only has room for a monogram. The full name stays in the
          accessibility tree via sr-only rather than being display:none, so it is still
          announced while collapsed. */}
      <span className="truncate text-[15px] font-bold tracking-tight">
        <span aria-hidden="true" className="group-hover/rail:hidden">TF</span>
        <span className="sr-only group-hover/rail:not-sr-only">ThinkFlow Studio</span>
      </span>
      <span className="sr-only font-mono text-[11px] text-muted-foreground group-hover/rail:not-sr-only">
        REV-01
      </span>
    </div>
  );
}
