"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Layers } from "lucide-react";

interface Category {
  id: string;
  nombre: string;
  activo: boolean;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedId: string;
}

export default function CategorySidebar({
  categories,
  selectedId,
}: CategorySidebarProps) {
  const router = useRouter();

  const handleSelect = (id: string) => {
    if (id === "all") {
      router.push("/");
    } else {
      router.push(`/?categoria=${id}`);
    }
    router.refresh();
  };

  return (
    <div className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md py-4 mb-8 border-b border-stone-200/80 transition-all">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 snap-x">
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 mr-2 shrink-0">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          Categorías:
        </span>

        {/* Botón 'Todos' */}
        <button
          type="button"
          onClick={() => handleSelect("all")}
          className={`snap-start shrink-0 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            selectedId === "all" || !selectedId
              ? "bg-stone-900 text-white shadow-md ring-2 ring-stone-900/10"
              : "bg-white text-stone-700 border border-stone-200 hover:border-emerald-600 hover:text-emerald-700 hover:shadow-sm"
          }`}
        >
          ✨ Todos
        </button>

        {/* Botones de categorías */}
        {categories.map((cat) => {
          const isSelected = selectedId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id)}
              className={`snap-start shrink-0 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/20"
                  : "bg-white text-stone-700 border border-stone-200 hover:border-emerald-600 hover:text-emerald-700 hover:shadow-sm"
              }`}
            >
              {cat.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}