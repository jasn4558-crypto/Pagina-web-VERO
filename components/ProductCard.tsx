"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";

interface ProductCardProps {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagen: string;
}

export default function ProductCard({
  id,
  nombre,
  precio,
  descripcion,
  imagen,
}: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagen}
          alt={nombre}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold text-zinc-900">{nombre}</h3>
        <p className="line-clamp-2 text-sm text-zinc-600">{descripcion}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-zinc-900">
            ₡{precio.toLocaleString("es-CR")}
          </span>
          <button
            type="button"
            onClick={() => addToCart({ id, nombre, precio, imagen })}
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}