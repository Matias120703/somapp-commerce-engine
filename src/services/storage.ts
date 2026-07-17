import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

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
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}
