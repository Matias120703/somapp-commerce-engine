import { createClient } from "@/lib/supabase/client";

/**
 * Toda la comunicación con la tabla `categories` vive acá -- ningún
 * componente ni hook arma una query de Supabase por su cuenta, mismo
 * criterio que `services/products.ts`. `AdminCategory` es un tipo propio
 * del panel (no el `Category` de config/categories.ts que sigue usando la
 * tienda pública): incluye `productCount`, un dato que la tienda pública
 * nunca necesita.
 *
 * Extendido en el Sprint 5.4: antes (Fase 10) este archivo solo tenía
 * `listCategories()` de solo lectura para el selector del formulario de
 * productos -- se amplía en el mismo archivo, no en uno nuevo, porque
 * sigue siendo "toda la comunicación con `categories`" (mismo criterio que
 * ya separa un archivo de servicio por tabla).
 */

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  accentColor: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
};

export type CategoryFormInput = {
  name: string;
  slug: string;
  description: string;
  accentColor: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  accent_color: string | null;
  icon_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  products: { count: number }[] | null;
};

const CATEGORY_SELECT = `
  id, name, slug, description, accent_color, icon_name, display_order, is_active, created_at,
  products ( count )
`;

function mapCategoryRow(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    accentColor: row.accent_color,
    iconName: row.icon_name,
    displayOrder: row.display_order,
    isActive: row.is_active,
    productCount: row.products?.[0]?.count ?? 0,
    createdAt: row.created_at,
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as unknown as CategoryRow[]).map(mapCategoryRow);
}

export async function getCategoryById(id: string): Promise<AdminCategory | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCategoryRow(data as unknown as CategoryRow) : null;
}

/** Chequeo proactivo para el formulario (mejor UX que esperar el error de la
 * base) -- el índice único `categories_slug_key` (Fase 8) es quien de
 * verdad garantiza la unicidad; esto es solo la validación de UI. */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = createClient();
  let query = supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

function toRow(input: CategoryFormInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    accent_color: input.accentColor,
    icon_name: input.iconName,
    display_order: input.displayOrder,
    is_active: input.isActive,
  };
}

export async function createCategory(input: CategoryFormInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(toRow(input))
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ya existe una categoría con ese slug.");
    throw new Error(error.message);
  }
  return data.id as string;
}

export async function updateCategory(id: string, input: CategoryFormInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("categories").update(toRow(input)).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("Ya existe una categoría con ese slug.");
    throw new Error(error.message);
  }
}

/** Cuántos productos referencian hoy esta categoría -- usado tanto para
 * decidir si el borrado se puede intentar como para el chequeo final,
 * fresco, justo antes de borrar (ver deleteCategory). */
export async function getCategoryProductCount(categoryId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * No rompe integridad referencial: `products.category_id` ya tiene
 * `on delete restrict` (Fase 8) -- Postgres directamente rechaza el
 * borrado si hay productos asociados. Acá se hace además un chequeo
 * proactivo (mejor mensaje, sin depender del texto crudo del error de
 * Postgres) y se conserva el catch de "23503" como red de seguridad ante
 * una carrera (otro admin crea un producto justo entre el chequeo y el
 * borrado).
 */
export async function deleteCategory(id: string): Promise<void> {
  const productCount = await getCategoryProductCount(id);
  if (productCount > 0) {
    throw new Error(
      `No se puede eliminar: tiene ${productCount} producto${productCount === 1 ? "" : "s"} asociado${productCount === 1 ? "" : "s"}. Reasigná o eliminá esos productos primero.`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: todavía tiene productos asociados. Reasigná o eliminá esos productos primero."
      );
    }
    throw new Error(error.message);
  }
}
