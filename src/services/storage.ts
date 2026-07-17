import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";

const BUCKET = "product-images";
const CONTENT_BUCKET = "product-content";
const CATEGORY_BUCKET = "category-images";

/**
 * Toda comunicación con Supabase Storage vive acá -- ningún componente ni
 * hook llama a supabase.storage directamente (mismo criterio que
 * services/products.ts para la base de datos).
 */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${productId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getStoragePathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function deleteProductImageFiles(urls: string[]): Promise<void> {
  const paths = urls
    .map(getStoragePathFromUrl)
    .filter((path): path is string => path !== null);

  if (paths.length === 0) return;

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
  assertRowAffected(data, "No se pudieron eliminar las imágenes: no tenés permisos de administrador.");
}

/**
 * Bucket separado (`product-content`, Sprint 6.3) para las imágenes/GIFs/
 * videos que un admin inserta DENTRO del texto de la descripción
 * enriquecida -- no son parte de la galería (`product_images`), así que
 * no comparten ruta con `uploadProductImage`. `scopeId` es el `productId`
 * real en modo edición, o un UUID generado una sola vez en el cliente
 * (`ProductForm.tsx`) mientras se está creando un producto nuevo que
 * todavía no tiene id -- mismo criterio que cualquier CMS (WordPress,
 * Notion): el archivo se sube al insertarlo en el editor, no recién al
 * guardar el formulario completo, porque eso requeriría sincronizar URLs
 * de blob locales con URLs reales dentro del documento del editor.
 */
export async function uploadDescriptionAsset(scopeId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${scopeId}/description/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(CONTENT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(CONTENT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Imagen 1:1 por categoría (Sprint 6.6, bucket propio `category-images`) --
 * mismo patrón que `uploadProductImage` (una carpeta por registro, nombre
 * de archivo con UUID para evitar colisiones/caché de CDN), pero un único
 * archivo por categoría en vez de una galería. `categoryId` es el id real
 * en modo edición, o un UUID generado una sola vez en el cliente
 * (`CategoryForm.tsx`) mientras se está creando una categoría nueva que
 * todavía no tiene id -- mismo criterio ya usado por `descriptionScopeId`
 * en `ProductForm.tsx`.
 */
export async function uploadCategoryImage(categoryId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${categoryId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(CATEGORY_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(CATEGORY_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getCategoryImagePathFromUrl(url: string): string | null {
  const marker = `/object/public/${CATEGORY_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function deleteCategoryImageFile(url: string): Promise<void> {
  const path = getCategoryImagePathFromUrl(url);
  if (!path) return;

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(CATEGORY_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
  assertRowAffected(data, "No se pudo eliminar la imagen de la categoría: no tenés permisos de administrador.");
}
