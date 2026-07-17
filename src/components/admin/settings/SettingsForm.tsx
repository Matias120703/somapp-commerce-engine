"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type PendingBrandingAsset } from "@/components/admin/settings/BrandingAssetField";
import { useSettings } from "@/hooks/useSettings";
import {
  deleteBrandingAsset,
  uploadBrandingAsset,
  type SettingsFormInput,
} from "@/services/settings";

type FieldErrors = Partial<Record<"storeName" | "whatsappNumber", string>>;

function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Un solo formulario, un solo submit -- `business_settings` es una fila
 * única, no una lista: no tendría sentido guardar cada tarjeta por
 * separado (5 round-trips para una sola entidad). Las "tarjetas" que pide
 * el sprint son puramente visuales (SettingsSection), no forms
 * independientes. Mismo patrón que ProductForm: estado local por campo,
 * validar, guardar, volver.
 *
 * Sprint 6.3: la tarjeta "Branding" (Logo + Favicon) se ocultó de esta
 * pantalla -- ver CLAUDE.md sección 9, Fase 23. `pendingLogo`/
 * `pendingFavicon`/`removeLogo`/`removeFavicon` y la lógica de
 * subida/borrado en `handleSubmit` se dejaron intactas a propósito (nunca
 * se disparan sin la UI que las controlaba, pero la funcionalidad en sí
 * -- y `BrandingAssetField.tsx` -- siguen existiendo sin tocar, listas
 * para reconectarse). `logoSizeError`/`faviconSizeError` sí se quitaron:
 * solo existían para mostrarse en esa UI, sin ella quedaban sin ningún
 * lugar donde leerse.
 */
export function SettingsForm() {
  const router = useRouter();
  const { settings, isLoading, error: loadError, save } = useSettings();

  const [form, setForm] = useState<SettingsFormInput | null>(null);
  const [pendingLogo, setPendingLogo] = useState<PendingBrandingAsset>(null);
  const [pendingFavicon, setPendingFavicon] = useState<PendingBrandingAsset>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (pendingLogo) URL.revokeObjectURL(pendingLogo.previewUrl);
      if (pendingFavicon) URL.revokeObjectURL(pendingFavicon.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al desmontar
  }, []);

  function update<K extends keyof SettingsFormInput>(key: K, value: SettingsFormInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function validate(current: SettingsFormInput): FieldErrors {
    const errors: FieldErrors = {};
    if (!current.storeName.trim()) errors.storeName = "El nombre del negocio es obligatorio.";
    if (!current.whatsappNumber.trim()) errors.whatsappNumber = "El número de WhatsApp es obligatorio.";
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSubmitError(null);
    setSavedAt(null);

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      let logoUrl = removeLogo ? null : form.logoUrl;
      let faviconUrl = removeFavicon ? null : form.faviconUrl;

      if (pendingLogo) {
        logoUrl = await uploadBrandingAsset("logo", pendingLogo.file);
        if (form.logoUrl) await deleteBrandingAsset(form.logoUrl);
      } else if (removeLogo && form.logoUrl) {
        await deleteBrandingAsset(form.logoUrl);
      }

      if (pendingFavicon) {
        faviconUrl = await uploadBrandingAsset("favicon", pendingFavicon.file);
        if (form.faviconUrl) await deleteBrandingAsset(form.faviconUrl);
      } else if (removeFavicon && form.faviconUrl) {
        await deleteBrandingAsset(form.faviconUrl);
      }

      const input: SettingsFormInput = { ...form, logoUrl, faviconUrl };
      await save(input);

      setForm(input);
      setPendingLogo(null);
      setPendingFavicon(null);
      setRemoveLogo(false);
      setRemoveFavicon(false);
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo guardar la configuración.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando configuración...</p>;
  }

  if (loadError || !form) {
    return <p className="text-sm text-destructive">{loadError ?? "No se pudo cargar la configuración."}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <SettingsSection
        title="Información general"
        description="Identidad básica del negocio, visible en toda la tienda."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="Nombre del negocio" htmlFor="storeName" required>
            <Input
              id="storeName"
              value={form.storeName}
              onChange={(event) => update("storeName", event.target.value)}
            />
            {fieldErrors.storeName ? <p className="text-xs text-destructive">{fieldErrors.storeName}</p> : null}
          </FormField>

          <FormField label="Eslogan" htmlFor="tagline">
            <Input
              id="tagline"
              value={form.tagline ?? ""}
              onChange={(event) => update("tagline", event.target.value || null)}
            />
          </FormField>
        </div>

        <FormField label="Descripción corta" htmlFor="storeDescription">
          <Textarea
            id="storeDescription"
            rows={3}
            value={form.storeDescription ?? ""}
            onChange={(event) => update("storeDescription", event.target.value || null)}
          />
        </FormField>
      </SettingsSection>

      <SettingsSection
        title="Contacto"
        description="Datos que se muestran en el Header, el Footer y la página de Contacto."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="WhatsApp" htmlFor="whatsappNumber" required>
            <Input
              id="whatsappNumber"
              value={form.whatsappNumber}
              onChange={(event) => update("whatsappNumber", event.target.value)}
              placeholder="595981234567"
            />
            {fieldErrors.whatsappNumber ? (
              <p className="text-xs text-destructive">{fieldErrors.whatsappNumber}</p>
            ) : null}
          </FormField>

          <FormField label="Email" htmlFor="contactEmail">
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail ?? ""}
              onChange={(event) => update("contactEmail", event.target.value || null)}
            />
          </FormField>

          <FormField label="Dirección" htmlFor="contactAddress">
            <Input
              id="contactAddress"
              value={form.contactAddress ?? ""}
              onChange={(event) => update("contactAddress", event.target.value || null)}
            />
          </FormField>

          <FormField label="Horario de atención" htmlFor="contactHours">
            <Input
              id="contactHours"
              value={form.contactHours ?? ""}
              onChange={(event) => update("contactHours", event.target.value || null)}
            />
          </FormField>
        </div>
      </SettingsSection>

      <SettingsSection title="Redes sociales" description="Links que se muestran en el Footer.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FormField label="Instagram" htmlFor="instagramUrl">
            <Input
              id="instagramUrl"
              value={form.instagramUrl ?? ""}
              onChange={(event) => update("instagramUrl", event.target.value || null)}
              placeholder="https://instagram.com/..."
            />
          </FormField>

          <FormField label="Facebook" htmlFor="facebookUrl">
            <Input
              id="facebookUrl"
              value={form.facebookUrl ?? ""}
              onChange={(event) => update("facebookUrl", event.target.value || null)}
              placeholder="https://facebook.com/..."
            />
          </FormField>

          <FormField label="TikTok" htmlFor="tiktokUrl">
            <Input
              id="tiktokUrl"
              value={form.tiktokUrl ?? ""}
              onChange={(event) => update("tiktokUrl", event.target.value || null)}
              placeholder="https://tiktok.com/@..."
            />
          </FormField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Ubicación"
        description="Referencia geográfica del negocio, usada en el mapa de la página de Contacto."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="País" htmlFor="mapCountry">
            <Input
              id="mapCountry"
              value={form.mapCountry ?? ""}
              onChange={(event) => update("mapCountry", event.target.value || null)}
            />
          </FormField>

          <FormField label="Ciudad" htmlFor="mapCity">
            <Input
              id="mapCity"
              value={form.mapCity ?? ""}
              onChange={(event) => update("mapCity", event.target.value || null)}
            />
          </FormField>

          <FormField label="Latitud" htmlFor="mapDefaultLat">
            <Input
              id="mapDefaultLat"
              type="number"
              step="any"
              value={form.mapDefaultLat}
              onChange={(event) => update("mapDefaultLat", Number(event.target.value))}
            />
          </FormField>

          <FormField label="Longitud" htmlFor="mapDefaultLng">
            <Input
              id="mapDefaultLng"
              type="number"
              step="any"
              value={form.mapDefaultLng}
              onChange={(event) => update("mapDefaultLng", Number(event.target.value))}
            />
          </FormField>

          <FormField label="Zoom del mapa" htmlFor="mapDefaultZoom">
            <Input
              id="mapDefaultZoom"
              type="number"
              step="1"
              min={1}
              max={20}
              value={form.mapDefaultZoom}
              onChange={(event) => update("mapDefaultZoom", Number(event.target.value))}
            />
          </FormField>
        </div>
      </SettingsSection>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      {savedAt ? <p className="text-sm text-emerald-600">Configuración guardada.</p> : null}

      <div className="flex justify-end border-t border-border pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
