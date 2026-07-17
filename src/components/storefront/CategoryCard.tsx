"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import type { Category } from "@/config/categories";
import { sectionItemVariants as item } from "@/lib/motion";

/**
 * Extraída de FeaturedCategories (Sprint 4.4) para reutilizarla también en
 * /categorias — mismo JSX y estilos, sin ningún cambio visual. El link
 * pasó de /categoria/[slug] (ruta que nunca existió) a /categorias/[slug].
 */
export function CategoryCard({
  category,
  className,
}: {
  category: Category;
  /** Clases de layout que decide el contenedor (carrusel, grilla, etc). */
  className?: string;
}) {
  const initial = category.name.charAt(0);

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={className}
    >
      {/*
        category.image queda reservado para cuando haya foto real del
        cliente. Hasta entonces se muestra un placeholder de diseño
        (mismo lenguaje visual que el Hero) tintado con accentColor.
      */}
      <Link
        href={`/categorias/${category.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/60">
          <div
            className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
            style={
              category.accentColor
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
            {initial}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
          <p className="text-sm text-muted-foreground">{category.description}</p>
          <div className="mt-3 flex items-center text-foreground">
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
