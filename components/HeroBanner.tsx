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
    <header className="relative pt-12 sm:pt-20 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-8 bg-stone-50 text-center flex flex-col items-center justify-center border-b border-stone-200/60">
      {/* Insignia superior editable */}
      {config.badge_text && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-700 border border-emerald-200/60 mb-3">
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {config.badge_text}
        </span>
      )}

      {/* Título Principal editable */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight uppercase max-w-3xl leading-tight mb-2 sm:mb-3">
        {config.titulo_principal}{" "}
        {config.titulo_destacado && (
          <span className="italic font-light text-emerald-600">
            {config.titulo_destacado}
          </span>
        )}
      </h1>

      {/* Descripción editable */}
      {config.descripcion && (
        <p className="text-stone-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed mb-4">
          {config.descripcion}
        </p>
      )}

      {/* Botón editable */}
      {config.boton_texto && (
        <button
          type="button"
          onClick={scrollToCatalog}
          className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-2.5 sm:px-7 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-emerald-600 hover:shadow-lg active:scale-95"
        >
          <span>{config.boton_texto}</span>
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      )}
    </header>
  );
}