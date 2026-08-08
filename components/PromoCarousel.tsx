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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // En móvil desliza si hay más de 3 productos. En desktop si hay más de 6.
  const shouldScroll = isMobile ? items.length > 3 : items.length > 6;
  const CARD_W = isMobile ? 124 : 216; // ancho + gap según dispositivo
  const SPEED = 0.6; // px per frame

  // Duplicar únicamente si requiere scroll para el loop continuo
  const displayItems = shouldScroll ? [...items, ...items, ...items] : items;

  const animate = useCallback(() => {
    if (!shouldScroll) return;
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
  }, [items.length, shouldScroll, CARD_W]);

  useEffect(() => {
    if (!shouldScroll) return;
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animate, shouldScroll]);

  const scrollBy = (dir: number) => {
    if (!shouldScroll) return;
    offsetRef.current += dir * CARD_W;
    const totalW = items.length * CARD_W;
    if (offsetRef.current < 0) offsetRef.current += totalW;
    if (offsetRef.current >= totalW) offsetRef.current -= totalW;
  };

  // Touch / mouse drag
  const onPointerDown = (e: React.PointerEvent) => {
    if (!shouldScroll) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragOffsetStartRef.current = offsetRef.current;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !shouldScroll) return;
    const delta = dragStartXRef.current - e.clientX;
    offsetRef.current = dragOffsetStartRef.current + delta;
    const totalW = items.length * CARD_W;
    if (offsetRef.current < 0) offsetRef.current += totalW;
    if (offsetRef.current >= totalW) offsetRef.current -= totalW;
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  if (items.length === 0) return null;

  return (
    <section className="relative border-b border-stone-200 bg-white py-3 sm:py-4 select-none overflow-hidden">
      {/* Título */}
      <div className="mb-2.5 flex items-center justify-center gap-1.5 sm:mb-3 sm:gap-2">
        <Tag className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-stone-800 sm:text-sm">
          Ofertas Especiales
        </span>
        <Tag className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
      </div>

      {/* Si NO requiere scroll (Fijo centrado: <=3 en móvil, <=6 en desktop) */}
      {!shouldScroll ? (
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-2 sm:gap-4 sm:px-4">
          {items.map((item) => {
            const precioNuevo = Math.round(
              item.precio_original * (1 - item.descuento / 100)
            );
            return (
              <div
                key={item.id}
                className="flex w-[114px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-stone-100 bg-stone-50 p-2 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md sm:w-[200px] sm:rounded-2xl sm:gap-2 sm:p-3 group"
              >
                {/* Imagen */}
                <div className="relative h-16 w-full overflow-hidden rounded-lg bg-stone-100 sm:h-24 sm:rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow sm:top-1.5 sm:left-1.5 sm:px-2 sm:text-[10px]">
                    -{item.descuento}%
                  </span>
                </div>

                {/* Info */}
                <p className="w-full truncate text-center text-[10px] font-semibold text-stone-800 sm:text-xs">
                  {item.nombre}
                </p>

                {/* Precios */}
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  <span className="text-[9px] text-stone-400 line-through sm:text-[11px]">
                    ₡{item.precio_original.toLocaleString("es-CR")}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 sm:text-sm">
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
                  className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-600 py-1 text-[10px] font-bold text-white transition hover:bg-emerald-500 active:scale-95 sm:gap-1.5 sm:py-1.5 sm:text-[11px]"
                >
                  <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Agregar
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Si REQUIERE scroll (>3 en móvil, >6 en desktop): Carrusel animado */
        <div className="relative mx-auto max-w-6xl overflow-hidden px-7 sm:px-10">
          {/* Fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent sm:w-12" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent sm:w-12" />

          {/* Botones nav */}
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            onMouseEnter={() => (pausedRef.current = true)}
            onMouseLeave={() => (pausedRef.current = false)}
            className="absolute left-0.5 top-1/2 z-20 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white/90 shadow transition hover:bg-stone-50 sm:left-1 sm:h-8 sm:w-8"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-stone-600 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            onMouseEnter={() => (pausedRef.current = true)}
            onMouseLeave={() => (pausedRef.current = false)}
            className="absolute right-0.5 top-1/2 z-20 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white/90 shadow transition hover:bg-stone-50 sm:right-1 sm:h-8 sm:w-8"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-3.5 w-3.5 text-stone-600 sm:h-4 sm:w-4" />
          </button>

          {/* Track */}
          <div
            className="overflow-hidden"
            onMouseEnter={() => (pausedRef.current = true)}
            onMouseLeave={() => {
              pausedRef.current = false;
              isDraggingRef.current = false;
            }}
          >
            <div
              ref={trackRef}
              className="flex gap-2.5 sm:gap-4 will-change-transform"
              style={{ width: `${displayItems.length * CARD_W}px` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {displayItems.map((item, idx) => {
                const precioNuevo = Math.round(
                  item.precio_original * (1 - item.descuento / 100)
                );
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex w-[114px] shrink-0 cursor-grab active:cursor-grabbing flex-col items-center gap-1.5 rounded-xl border border-stone-100 bg-stone-50 p-2 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:w-[200px] sm:rounded-2xl sm:gap-2 sm:p-3 group"
                    draggable={false}
                  >
                    {/* Imagen */}
                    <div className="relative h-16 w-full overflow-hidden rounded-lg bg-stone-100 sm:h-24 sm:rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        draggable={false}
                      />
                      <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow sm:top-1.5 sm:left-1.5 sm:px-2 sm:text-[10px]">
                        -{item.descuento}%
                      </span>
                    </div>

                    {/* Info */}
                    <p className="w-full truncate text-center text-[10px] font-semibold text-stone-800 sm:text-xs">
                      {item.nombre}
                    </p>

                    {/* Precios */}
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                      <span className="text-[9px] text-stone-400 line-through sm:text-[11px]">
                        ₡{item.precio_original.toLocaleString("es-CR")}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 sm:text-sm">
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
                      className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-600 py-1 text-[10px] font-bold text-white transition hover:bg-emerald-500 active:scale-95 sm:gap-1.5 sm:py-1.5 sm:text-[11px]"
                    >
                      <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      Agregar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
