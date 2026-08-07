"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { getHeaderConfig, DEFAULT_HEADER_CONFIG, HeaderConfig } from "@/lib/configManager";

export default function HeroBanner() {
  const [config, setConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);

  useEffect(() => {
    getHeaderConfig().then((cfg) => setConfig(cfg));
  }, []);

  const scrollToCatalog = () => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-stone-50 text-center flex flex-col items-center justify-center border-b border-stone-200/60">
      {/* Insignia superior editable */}
      {config.badge_text && (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700 border border-emerald-200/60 mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          {config.badge_text}
        </span>
      )}

      {/* Título Principal editable */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight uppercase max-w-3xl leading-none mb-4">
        {config.titulo_principal}{" "}
        {config.titulo_destacado && (
          <span className="italic font-light text-emerald-600">
            {config.titulo_destacado}
          </span>
        )}
      </h1>

      {/* Descripción editable */}
      {config.descripcion && (
        <p className="text-stone-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-6">
          {config.descripcion}
        </p>
      )}

      {/* Botón editable */}
      {config.boton_texto && (
        <button
          type="button"
          onClick={scrollToCatalog}
          className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-emerald-600 hover:shadow-lg active:scale-95"
        >
          <span>{config.boton_texto}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}