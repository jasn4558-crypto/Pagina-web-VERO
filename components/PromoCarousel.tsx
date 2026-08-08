"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Tag, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export interface PromoItem {
  id: string;
  producto_id: string;
  nombre: string;
  imagen: string;
  precio_original: number;
  descuento: number; // porcentaje 1-99
}

interface PromoCarouselProps {
  items: PromoItem[];
}

export default function PromoCarousel({ items }: PromoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragOffsetStartRef = useRef(0);
  const { addToCart } = useCart();

  const CARD_W = 220; // px per card including gap
  const SPEED = 0.6;  // px per frame

  // Duplicar items para loop infinito
  const looped = items.length > 0 ? [...items, ...items, ...items] : [];

  const animate = useCallback(() => {
    if (!pausedRef.current && !isDraggingRef.current) {
      offsetRef.current += SPEED;
      const totalW = items.length * CARD_W;
      if (offsetRef.current >= totalW) {
        offsetRef.current -= totalW;
      }
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }
    animRef.current = requestAnimationFrame(animate);
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animate, items.length]);

  const scrollBy = (dir: number) => {
    offsetRef.current += dir * CARD_W;
    const totalW = items.length * CARD_W;
    if (offsetRef.current < 0) offsetRef.current += totalW;
    if (offsetRef.current >= totalW) offsetRef.current -= totalW;
  };

  // Touch / mouse drag
  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragOffsetStartRef.current = offsetRef.current;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const delta = dragStartXRef.current - e.clientX;
    offsetRef.current = dragOffsetStartRef.current + delta;
    const totalW = items.length * CARD_W;
    if (offsetRef.current < 0) offsetRef.current += totalW;
    if (offsetRef.current >= totalW) offsetRef.current -= totalW;
  };

  const onPointerUp = () => { isDraggingRef.current = false; };

  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-white py-4 select-none">
      {/* Título */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <Tag className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-stone-800">
          Ofertas Especiales
        </span>
        <Tag className="h-4 w-4 text-emerald-600" />
      </div>

      {/* Fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

      {/* Botones nav */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white shadow-md transition hover:bg-stone-50"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-4 w-4 text-stone-600" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white shadow-md transition hover:bg-stone-50"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-4 w-4 text-stone-600" />
      </button>

      {/* Track */}
      <div
        className="overflow-hidden px-10"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => { pausedRef.current = false; isDraggingRef.current = false; }}
      >
        <div
          ref={trackRef}
          className="flex gap-4 will-change-transform"
          style={{ width: `${looped.length * CARD_W}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {looped.map((item, idx) => {
            const precioNuevo = Math.round(item.precio_original * (1 - item.descuento / 100));
            return (
              <div
                key={`${item.id}-${idx}`}
                className="flex w-[200px] shrink-0 cursor-grab active:cursor-grabbing flex-col items-center gap-2 rounded-2xl border border-stone-100 bg-stone-50 p-3 shadow-sm transition hover:shadow-md hover:border-emerald-200 group"
                draggable={false}
              >
                {/* Imagen */}
                <div className="relative h-24 w-full overflow-hidden rounded-xl bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    draggable={false}
                  />
                  {/* Badge descuento */}
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
                    -{item.descuento}%
                  </span>
                </div>

                {/* Info */}
                <p className="w-full truncate text-center text-xs font-semibold text-stone-800">
                  {item.nombre}
                </p>

                {/* Precios */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400 line-through">
                    ₡{item.precio_original.toLocaleString("es-CR")}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    ₡{precioNuevo.toLocaleString("es-CR")}
                  </span>
                </div>

                {/* Botón agregar */}
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      id: item.producto_id,
                      nombre: item.nombre,
                      precio: precioNuevo,
                      imagen: item.imagen,
                    })
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 active:scale-95"
                >
                  <ShoppingCart className="h-3 w-3" />
                  Agregar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
