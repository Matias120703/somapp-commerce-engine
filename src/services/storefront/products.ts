import type { Product } from "@/config/products";
import { createClient } from "@/lib/supabase/server";

/**
 * Lectura pública de `products` (Sprint 5.3) -- usa el cliente de servidor
 * (lib/supabase/server.ts, ya usado por el panel para verificar sesión),
 * no el de browser que usa services/products.ts del panel. Devuelve
 * exactamente el mismo `Product` que hasta ahora exportaba
 * config/products.ts: ningún componente de storefront/ tuvo que cambiar
 * su forma de leer un producto, solo de dónde viene el array (principio
 * 3 de CLAUDE.md). RLS (`products_public_read_active`) ya filtra
 * `is_active = true` para el rol `anon`, pero esa policy convive con
 * `products_admin_read_all` (`to authenticated using (is_admin())`): si
 * la request trae una sesión de admin activa (mismo navegador que el
 * panel), corre como `authenticated` y ambas policies se combinan con
 * OR -- seguiría viendo productos inactivos. Se agrega `.eq("is_active",
 * true)` explícito acá (auditoría del Sprint 6.0.1, mismo criterio que el
 * bug 4 de categorías) para que la tienda pública nunca dependa de qué
 * sesión traiga la request.
 */

type PublicProductRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  price: number;
  old_price: number | null;
  stock: number;
  featured: boolean;
  on_sale: boolean;
  badge: string | null;
  categories: { slug: string } | null;
  product_images: { url: string; display_order: number }[];
};

const PUBLIC_PRODUCT_SELECT = `
  id, name, slug, short_description, price, old_price, stock, featured, on_sale, badge,
  categories ( slug ),
  product_images ( url, display_order )
`;

function mapPublicProduct(row: PublicProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.categories?.slug ?? "",
    shortDescription: row.short_description,
    price: Number(row.price),
    oldPrice: row.old_price !== null ? Number(row.old_price) : undefined,
    images: [...row.product_images]
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => image.url),
    featured: row.featured,
    onSale: row.on_sale,
    stock: row.stock,
    badge: row.badge ?? undefined,
  };
}

/** Mismo orden que tenía el array manual de config/products.ts: el seed
 * insertó los productos en ese mismo orden, con created_at secuencial. */
export async function getPublicProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as unknown as PublicProductRow[]).map(mapPublicProduct);
}

export async function getPublicProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPublicProduct(data as unknown as PublicProductRow) : undefined;
}

/**
 * Mismo criterio que la vieja getRelatedProducts de config/products.ts:
 * misma categoría, excluyendo el producto actual. Reutiliza
 * getPublicProducts() en vez de una segunda query especial -- el catálogo
 * es chico y ya se trae completo en la misma request de todos modos.
 */
export async function getPublicRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const allProducts = await getPublicProducts();
  return allProducts
    .filter((candidate) => candidate.category === product.category && candidate.id !== product.id)
    .slice(0, limit);
}

/**
 * Productos para el Showcase del Hero (Sprint 6.3): destacados primero
 * -- si hay al menos uno activo, se muestran únicamente esos --, y si no
 * hay ningún destacado, se cae a los más recientes. Nunca queda vacío
 * mientras exista al menos un producto activo en la tienda.
 *
 * Consulta propia, no reutiliza getPublicProducts(): necesita ordenar por
 * `created_at desc` (para "más recientes") y limitar la cantidad a nivel
 * de Postgres, en vez de traer el catálogo entero y recortar en memoria
 * -- más simple además porque `Product` (config/products.ts) no expone
 * ninguna fecha, así que "más recientes" no se puede calcular sobre el
 * array que ya devuelve getPublicProducts().
 */
export async function getPublicHeroProducts(limit = 6): Promise<Product[]> {
  const supabase = await createClient();

  const { data: featuredData, error: featuredError } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (featuredError) throw new Error(featuredError.message);
  if (featuredData.length > 0) {
    return (featuredData as unknown as PublicProductRow[]).map(mapPublicProduct);
  }

  const { data: recentData, error: recentError } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (recentError) throw new Error(recentError.message);
  return (recentData as unknown as PublicProductRow[]).map(mapPublicProduct);
}
