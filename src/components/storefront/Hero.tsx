"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { BusinessSettings } from "@/services/storefront/business";
import { getWhatsAppUrl } from "@/lib/utils";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Hero({ settings }: { settings: BusinessSettings }) {
  const shouldReduceMotion = useReducedMotion();
  const whatsappHref = getWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <section className="relative overflow-hidden">
      <motion.div
        initial={shouldReduceMotion ? "show" : "hidden"}
        animate="show"
        variants={container}
        className="mx-auto grid min-h-[90vh] max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-24"
      >
        <div className="flex flex-col items-start gap-6">
          <motion.span
            variants={item}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {siteConfig.hero.eyebrow}
          </motion.span>

          <motion.h1
            variants={item}
            className="text-4xl leading-[1.05] font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {siteConfig.hero.title}
          </motion.h1>

          <motion.p variants={item} className="max-w-md text-lg text-muted-foreground">
            {siteConfig.hero.subtitle}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={siteConfig.hero.primaryCta.href} />}
              >
                {siteConfig.hero.primaryCta.label}
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" />
                }
              >
                <MessageCircle className="size-4" />
                {siteConfig.hero.secondaryCta.label}
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/*
          Marcador visual temporal y neutro. Cuando esté la imagen real del
          cliente, reemplazar el contenido de este div por un <Image />
          manteniendo el mismo contenedor (aspect ratio + rounded-[2rem]).
        */}
        <motion.div variants={item}>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-border bg-muted/40">
            <div className="absolute -top-10 -left-10 size-64 rounded-full bg-foreground/5 blur-3xl" />
            <div className="absolute -right-10 -bottom-16 size-72 rounded-full bg-foreground/10 blur-3xl" />
            <div
              className="absolute inset-0 text-foreground opacity-[0.15]"
              style={{
                backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            <div className="absolute inset-8 rounded-3xl border border-border/60 bg-background/40 backdrop-blur-sm" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
