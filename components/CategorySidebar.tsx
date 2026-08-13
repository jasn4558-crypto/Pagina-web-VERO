"use client";

import { useRouter } from "next/navigation";
import { Layers, Tag } from "lucide-react";

export interface Category {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Subcategory {
  id: string;
  categoria_id: string;
  nombre: string;
  activo: boolean;
}

interface CategorySidebarProps {
  categories: Category[];
  subcategories?: Subcategory[];
  selectedCategoryId: string;
  selectedSubcategoryId?: string;
}

export default function CategorySidebar({
  categories,
  subcategories = [],
  selectedCategoryId,
  selectedSubcategoryId,
}: CategorySidebarProps) {
  const router = useRouter();

  const handleCategorySelect = (id: string) => {
    if (id === "all") {
      router.push("/");
    } else {
      router.push(`/?categoria=${id}`);
    }
    router.refresh();
  };

  const handleSubcategorySelect = (subcatId: string) => {
    if (!selectedCategoryId || selectedCategoryId === "all") return;
    if (selectedSubcategoryId === subcatId) {
      // Toggle off subcategory filter
      router.push(`/?categoria=${selectedCategoryId}`);
    } else {
      router.push(`/?categoria=${selectedCategoryId}&subcategoria=${subcatId}`);
    }
    router.refresh();
  };

  // Subcategorías pertenecientes a la categoría seleccionada
  const activeSubcats = selectedCategoryId && selectedCategoryId !== "all"
    ? subcategories.filter((s) => s.categoria_id === selectedCategoryId)
    : [];

  return (
    <div className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md py-3 mb-6 border-b border-stone-200/80 transition-all space-y-2">
      {/* 1. Categorías Principales */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 snap-x">
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 mr-2 shrink-0">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          Categorías:
        </span>

        {/* Botón 'Todos' */}
        <button
          type="button"
          onClick={() => handleCategorySelect("all")}
          className={`snap-start shrink-0 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            selectedCategoryId === "all" || !selectedCategoryId
              ? "bg-stone-900 text-white shadow-md ring-2 ring-stone-900/10"
              : "bg-white text-stone-700 border border-stone-200 hover:border-emerald-600 hover:text-emerald-700 hover:shadow-sm"
          }`}
        >
          ✨ Todos
        </button>

        {/* Botones de categorías */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
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

      {/* 2. Subcategorías secundarias (si hay una categoría seleccionada y tiene subcategorías) */}
      {activeSubcats.length > 0 && (
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 snap-x pt-1 animate-in fade-in duration-200">
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 mr-1 shrink-0">
            <Tag className="h-3 w-3 text-emerald-600" />
            Subcategorías:
          </span>

          <button
            type="button"
            onClick={() => router.push(`/?categoria=${selectedCategoryId}`)}
            className={`snap-start shrink-0 rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${
              !selectedSubcategoryId
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-white text-stone-600 border border-stone-200 hover:border-emerald-500"
            }`}
          >
            Todas
          </button>

          {activeSubcats.map((subcat) => {
            const isSubSelected = selectedSubcategoryId === subcat.id;
            return (
              <button
                key={subcat.id}
                type="button"
                onClick={() => handleSubcategorySelect(subcat.id)}
                className={`snap-start shrink-0 rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${
                  isSubSelected
                    ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/30"
                    : "bg-white text-stone-600 border border-stone-200 hover:border-emerald-500 hover:text-emerald-700"
                }`}
              >
                {subcat.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}