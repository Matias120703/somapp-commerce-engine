"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { cn, formatPrice } from "@/lib/utils";
import { sectionItemVariants as item } from "@/lib/motion";
import { getProductDisplayPrice } from "@/lib/promotions";
import type { PublicPromotion } from "@/services/storefront/promotions";
import { useCartStore } from "@/store/cart-store";

/**
 * Las 5 fotos sembradas en el Sprint 4.8/Fase 8 son rutas locales de
 * config/products.ts (`/products/iphone-14-1.jpg`) que nunca existieron
 * como archivo real -- solo una foto subida de verdad desde el Panel
 * (Fase 10) llega acá como URL absoluta de Supabase Storage. Es la misma
 * señal, sin hardcodear ningún dominio ni producto puntual.
 */
function isRealImageUrl(url: string | undefined): url is string {
  return Boolean(url && url.startsWith("http"));
}

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return { label: "Sin stock", dotClassName: "bg-muted-foreground" };
  }
  if (stock <= 5) {
    return { label: "¡Últimas unidades!", dotClassName: "bg-amber-500" };
  }
  return { label: "En stock", dotClassName: "bg-emerald-500" };
}

export function ProductCard({
  product,
  categories,
  promotions,
  className,
}: {
  product: Product;
  /** Resuelta desde Supabase por la página que renderiza esta grilla
   * (Sprint 5.4) -- este componente ya no importa config/categories.ts. */
  categories: Category[];
  /** Promociones vigentes (Sprint 6.1), resueltas desde Supabase por la
   * misma página -- el precio/badge se calculan acá con
   * `getProductDisplayPrice`, este componente nunca calcula un descuento
   * por su cuenta. */
  promotions: PublicPromotion[];
  /** Clases de layout que decide el contenedor (carrusel, grilla, etc). */
  className?: string;
}) {
  const category = categories.find((c) => c.slug === product.category);
  const displayPrice = getProductDisplayPrice(product, promotions);
  const stockStatus = getStockStatus(product.stock);
  const outOfStock = product.stock <= 0;
  const addProduct = useCartStore((state) => state.addProduct);
  const [imageFailed, setImageFailed] = useState(false);
  const primaryImage = product.images.find(isRealImageUrl);
  const showImage = Boolean(primaryImage) && !imageFailed;

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={className}
    >
      {/*
        Si el producto tiene una foto real subida desde el Panel (URL
        absoluta de Supabase Storage), se muestra esa foto. Mientras no
        exista (los 5 productos sembrados originalmente, o cualquier
        producto sin fotos todavía), se muestra el mismo placeholder de
        diseño de siempre (mismo lenguaje visual que Hero y Categorías)
        tintado con el accentColor de su categoría.
      */}
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg">
        {/*
          Toda la superficie informativa (imagen + nombre + descripción +
          precio + stock) navega a la página del producto -- "Agregar al
          carrito" queda fuera del Link a propósito: un <button> anidado
          dentro de un <a> es HTML inválido y capturaría el click de
          navegación, así que vive como hermano en el mismo contenedor.
        */}
        <Link href={`/productos/${product.slug}`} className="flex flex-1 flex-col">
          <div className="relative aspect-square overflow-hidden bg-muted/60">
            {showImage ? (
              <Image
                src={primaryImage!}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
                  style={
                    category?.accentColor
                      ? {
                          backgroundImage: `radial-gradient(130% 100% at 100% 0%, ${category.accentColor}29, transparent 60%)`,
                        }
                      : undefined
                  }
                />
                <div
                  className="absolute inset-0 text-foreground opacity-[0.12]"
                  style={{
                    backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -bottom-4 text-8xl leading-none font-bold text-foreground/[0.08] select-none"
                >
                  {product.name.charAt(0)}
                </span>
              </>
            )}

            {displayPrice.badgeVariant === "discount" ? (
              <Badge className="absolute top-3 left-3">{displayPrice.badgeLabel}</Badge>
            ) : displayPrice.badgeVariant === "info" ? (
              <Badge variant="outline" className="absolute top-3 left-3 bg-background/90">
                {displayPrice.badgeLabel}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-2 p-5 pb-0">
            <h3 className="text-base font-semibold text-foreground">{product.name}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {product.shortDescription}
            </p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">
                {formatPrice(displayPrice.price)}
              </span>
              {displayPrice.compareAtPrice ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(displayPrice.compareAtPrice)}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", stockStatus.dotClassName)} />
              {stockStatus.label}
            </div>
          </div>
        </Link>

        <div className="p-5 pt-3">
          <Button
            disabled={outOfStock}
            className="w-full"
            onClick={() => addProduct(product)}
          >
            {outOfStock ? "Sin stock" : "Agregar al carrito"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
