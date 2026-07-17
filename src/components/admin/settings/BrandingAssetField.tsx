"use client";

import { useRef } from "react";
import { X } from "lucide-react";

import { FormField } from "@/components/shared/FormField";

export type PendingBrandingAsset = { file: File; previewUrl: string } | null;

/**
 * Un único archivo (no una galería como ProductImagesField): logo y
 * favicon son 1:1 con el negocio. Mismo patrón de "no subir nada hasta
 * guardar" que ProductImagesField -- el archivo elegido queda "pendiente"
 * (preview local vía URL.createObjectURL) y SettingsForm recién lo sube a
 * Storage al hacer submit, reemplazando/borrando el anterior si había uno.
 *
 * Sin consumidores activos desde el Sprint 6.3 (la sección "Branding" que
 * lo renderizaba se ocultó de /admin/configuracion, ver CLAUDE.md sección
 * 9, Fase 23) -- se deja el archivo tal cual, sin usarse, mismo criterio
 * que `config/products.ts`/`config/promotion.ts`: la funcionalidad sigue
 * existiendo intacta, lista para reconectarse si un sprint futuro la
 * necesita, sin haber sido tocada por ese sprint.
 */
export function BrandingAssetField({
  id,
  label,
  accept,
  currentUrl,
  pending,
  error,
  onSelectFile,
  onRemove,
}: {
  id: string;
  label: string;
  accept: string;
  currentUrl: string | null;
  pending: PendingBrandingAsset;
  /** Error de validación (ej. tamaño excedido) -- se muestra antes de
   * intentar subir nada, no un error de Supabase después de guardar. */
  error?: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = pending?.previewUrl ?? currentUrl;

  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/60">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- thumbnail interno del panel
            <img src={previewSrc} alt="" className="size-full object-contain p-1" />
          ) : (
            <span className="text-[10px] text-muted-foreground">Sin archivo</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {previewSrc ? "Reemplazar" : "Subir archivo"}
            </button>
            {previewSrc ? (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Quitar ${label}`}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
                Quitar
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG o ICO. Máximo 2 MB.</p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelectFile(file);
          event.target.value = "";
        }}
      />
    </FormField>
  );
}
