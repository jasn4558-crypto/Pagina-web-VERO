"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Tag, ChevronLeft } from "lucide-react";

interface Category {
  id: string;
  nombre: string;
  activo: boolean;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedId: string;
}

export default function CategorySidebar({ categories, selectedId }: CategorySidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSelect = (id: string) => {
    if (id === "all") {
      router.push("/");
    } else {
      router.push(`/?categoria=${id}`);
    }
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      {/* Botón hamburguesa en móvil */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg lg:hidden"
        aria-label="Abrir categorías"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 lg:static lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-16" : "lg:w-56"}`}
      >
        {/* Header sidebar */}
        <div className={`flex items-center border-b border-stone-100 px-4 py-3 ${collapsed ? "lg:justify-center" : "lg:justify-between"}`}>
          {!collapsed && (
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Tag className="h-4 w-4 text-emerald-600" />
              Categorías
            </h2>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 lg:hidden"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-full p-1.5 text-stone-500 hover:bg-stone-100 lg:block"
              aria-label="Colapsar"
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Lista de categorías */}
        <nav className="flex-1 overflow-y-auto p-2">
          {!collapsed && (
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedId === "all"
                  ? "bg-emerald-50 font-semibold text-emerald-700"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              Todos los productos
            </button>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id)}
              title={collapsed ? cat.nombre : undefined}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedId === cat.id
                  ? "bg-emerald-50 font-semibold text-emerald-700"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {collapsed ? cat.nombre.charAt(0).toUpperCase() : cat.nombre}
            </button>
          ))}
          {categories.length === 0 && !collapsed && (
            <p className="px-3 py-2 text-xs text-stone-400">
              No hay categorías.
            </p>
          )}
        </nav>
      </aside>
    </>
  );
}