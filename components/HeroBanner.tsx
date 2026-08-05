"use client";

import { ChevronRight, Sparkles } from "lucide-react";

export default function HeroBanner() {
  const scrollToCatalog = () => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 px-4 py-16 text-white sm:py-24">
      {/* Decoración */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
          Nuevas colecciones cada semana
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Descubre las{" "}
          <span className="text-yellow-200">Nuevas Tendencias</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90 sm:text-xl">
          Productos únicos y artesanales con envíos a todo el país.
          Compra fácil y recibe tu pedido en la puerta de tu casa.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={scrollToCatalog}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-lg font-bold text-emerald-700 shadow-lg transition-all hover:bg-yellow-100 hover:shadow-xl active:scale-95"
          >
            Ver Catálogo
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-white/80">
            Envíos a todo el país 🇨🇷
          </span>
        </div>
      </div>
    </section>
  );
}