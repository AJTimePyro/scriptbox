import type { ReactNode } from "react";

type SandboxFrameProps = {
  children: ReactNode;
  className?: string;
};

export function SandboxFrame({ children, className = "" }: SandboxFrameProps) {
  return (
    <div className={`relative flex min-h-0 flex-1 flex-col ${className}`}>
      <span
        className="pointer-events-none absolute top-0 left-0 z-30 size-2 border-t-2 border-l-2 border-accent/50"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute top-0 right-0 z-30 size-2 border-t-2 border-r-2 border-accent/50"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 z-30 size-2 border-b-2 border-l-2 border-accent/50"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-0 right-0 z-30 size-2 border-b-2 border-r-2 border-accent/50"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
