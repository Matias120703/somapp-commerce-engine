"use client";

import { motion, useReducedMotion } from "framer-motion";

import { categories } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { sectionContainerVariants, sectionItemVariants } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

/**
 * Toda la información sale del Cart Store: nada se recalcula acá.
 * Cuando exista checkout real, el envío se conecta reemplazando solo
 * la fila de "shippingPlaceholder" por el valor calculado.
 */
export function CheckoutSummary() {
  const shouldReduceMotion = useReducedMotion();
  const t = siteConfig.checkoutPage.summary;

  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());

  return (
    <motion.div
      initial={shouldReduceMotion ? "show" : "hidden"}
      animate="show"
      variants={sectionContainerVariants}
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6"
    >
      <motion.h2 variants={sectionItemVariants} className="text-lg font-semibold text-foreground">
        {t.title}
      </motion.h2>

      <motion.div variants={sectionItemVariants} className="flex flex-col gap-4">
        {items.map((item) => {
          const category = categories.find((c) => c.slug === item.product.category);

          return (
            <div key={item.product.id} className="flex items-center gap-3">
              {/*
                item.product.images queda reservado para la foto real.
                Mismo placeholder de diseño que el resto de la tienda.
              */}
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/60">
                <div
                  className="absolute inset-0"
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
                    backgroundSize: "10px 10px",
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{item.product.name}</span>
                <span className="text-xs text-muted-foreground">Cantidad: {item.quantity}</span>
              </div>

              <span className="text-sm font-semibold text-foreground">
                {formatPrice(item.product.price * item.quantity)}
              </span>
            </div>
          );
        })}
      </motion.div>

      <motion.div
        variants={sectionItemVariants}
        className="flex flex-col gap-3 border-t border-border pt-4 text-sm"
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t.itemCountLabel}</span>
          <span className="font-medium text-foreground tabular-nums">{itemCount}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t.subtotalLabel}</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t.shippingLabel}</span>
          <span className="font-medium text-foreground">{t.shippingPlaceholder}</span>
        </div>
      </motion.div>

      <motion.div
        variants={sectionItemVariants}
        className="flex items-center justify-between border-t border-border pt-4"
      >
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="text-xl font-bold text-foreground">{formatPrice(subtotal)}</span>
      </motion.div>
    </motion.div>
  );
}
