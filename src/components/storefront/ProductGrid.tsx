"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ProductCard } from "@/components/storefront/ProductCard";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { sectionContainerVariants } from "@/lib/motion";
import type { PublicPromotion } from "@/services/storefront/promotions";

/**
 * Grilla simple de productos, sin carrusel: pensada para páginas de
 * listado completo (catálogo, categoría, búsqueda, ofertas), a
 * diferencia de FeaturedProducts que arma su propio carrusel para la Home.
 * No conoce FeaturedProducts ni ningún otro componente: solo recibe
 * un array de Product (y, desde el Sprint 5.4, las categorías; desde el
 * Sprint 6.1, las promociones vigentes) ya resueltos desde Supabase y los
 * renderiza con ProductCard.
 */
export function ProductGrid({
  products,
  categories,
  promotions,
}: {
  products: Product[];
  categories: Category[];
  promotions: PublicPromotion[];
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={sectionContainerVariants}
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          categories={categories}
          promotions={promotions}
        />
      ))}
    </motion.div>
  );
}
