// components/ColorPickerField.tsx
"use client";

import { useMemo } from "react";
import { HexColorPicker } from "react-colorful";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

interface ColorPickerFieldProps {
  label: string;
  /** 6-char hex without '#', e.g. "FF00FF" */
  value?: string;
  /** onChange must return 6-char hex without '#', e.g. "FF00FF" */
  onChange: (value: string) => void;
  error?: string;
  onFocus?: () => void;
}

function toHashHex(input?: string) {
  const raw = (input ?? "").trim().replace(/^#/, "");
  const isValidLen = raw.length === 3 || raw.length === 6 || raw.length === 8;
  // fallback gray-200
  return `#${isValidLen ? raw : "e5e7eb"}`;
}

function stripHash(inputWithHash: string) {
  return inputWithHash.replace(/^#/, "").toUpperCase();
}

export function ColorPickerField({
  label,
  value,
  onChange,
  error,
  onFocus,
}: ColorPickerFieldProps) {
  // TIDAK ada state lokal dan TIDAK ada useEffect.
  const colorHash = useMemo(() => toHashHex(value), [value]);
  const preview = colorHash;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>

      <div className="flex gap-4 items-start" onFocus={onFocus}>
        <HexColorPicker
          color={colorHash}
          onChange={(next) => {
            const nextNoHash = stripHash(next);
            // Hindari update tak perlu (mencegah render storm)
            if (nextNoHash !== (value ?? "").toUpperCase()) {
              onChange(nextNoHash); // kirim balik TANPA '#'
            }
          }}
        />

        <div className="flex flex-col items-start gap-2 pt-1">
          <div
            className="border-2 border-border rounded-md w-20 h-10"
            style={{ backgroundColor: preview }}
            aria-label={`preview ${preview}`}
            title={preview}
          />
          <code className="text-xs text-muted-foreground">
            {stripHash(preview)}
          </code>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
