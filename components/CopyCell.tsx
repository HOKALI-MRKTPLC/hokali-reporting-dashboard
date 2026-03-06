"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyCellProps {
  value: string;
  className?: string;
}

export default function CopyCell({ value, className }: CopyCellProps) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-muted-foreground/40">—</span>;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <span className="inline-flex items-center gap-1 group cursor-pointer" onClick={handleCopy}>
      <span
        className={`font-mono truncate max-w-[90px] text-[11px] ${className ?? ""}`}
        title={value}
      >
        {value}
      </span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </span>
  );
}
