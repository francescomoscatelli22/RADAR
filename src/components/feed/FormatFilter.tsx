"use client";

import { FORMAT_LABEL, type Format } from "@/lib/feed";
import Chip from "@/components/ui/Chip";

const FORMATS: Format[] = ["all", "video", "article", "podcast", "thread", "release"];

/** Fila di chip per scegliere il formato (il filtro principale). Sta appoggiata sotto la testata. */
export default function FormatFilter({ value, onChange }: { value: Format; onChange: (f: Format) => void }) {
  return (
    <div
      className="sticky z-20 -mx-4 bg-bg px-4 py-3"
      style={{ top: "calc(var(--safe-top) + 56px)" }}
    >
      <div role="group" aria-label="Filtra per formato" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FORMATS.map((f) => (
          <Chip key={f} selected={value === f} onClick={() => onChange(f)}>
            {FORMAT_LABEL[f]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
