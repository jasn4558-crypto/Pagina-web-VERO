"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Phone,
  CheckCircle2,
  Truck,
  MapPin,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartProvider";
import { createOrder } from "@/lib/orderManager";
import { CR_LOCATIONS } from "@/lib/crLocations";

export default function FloatingCart() {
  const { items, totalItems, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");

  // Dirección encadenada
  const [provincia, setProvincia] = useState("San José");
  const [canton, setCanton] = useState("");
  const [distrito, setDistrito] = useState("");
  const [direccionExacta, setDireccionExacta] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Cantones según provincia seleccionada
  const cantones = useMemo(() => {
    return Object.keys(CR_LOCATIONS[provincia] || {}).sort();
  }, [provincia]);

  // Distritos según cantón seleccionado
  const distritos = useMemo(() => {
    if (!canton) return [];
    return (CR_LOCATIONS[provincia]?.[canton] || []).slice().sort();
  }, [provincia, canton]);

  const handleProvinciaChange = (prov: string) => {
    setProvincia(prov);
    setCanton("");
    setDistrito("");
  };

  const handleCantonChange = (cant: string) => {
    setCanton(cant);
    setDistrito("");
  };

  const handleGenerateOrder = async () => {
    if (!phone.trim()) {
      toast.error("Por favor ingresa tu número de WhatsApp.");
      return;
    }
    if (!canton) {
      toast.error("Por favor selecciona tu cantón.");
      return;
    }
    if (!distrito) {
      toast.error("Por favor selecciona tu distrito.");
      return;
    }
    if (!direccionExacta.trim()) {
      toast.error("Por favor ingresa la dirección exacta / señas.");
      return;
    }

    setIsGenerating(true);
    setSuccessMessage("");
    try {
      const numPedido = await createOrder(items, phone.trim(), {
        provincia,
        canton,
        distrito,
        direccionExacta: direccionExacta.trim(),
      });

      setSuccessMessage(
        `¡Pedido #${numPedido} recibido! Nos comunicaremos al ${phone.trim()} para coordinar el envío a ${distrito}, ${canton}, ${provincia}.`
      );
      toast.success(`¡Pedido #${numPedido} generado!`);
      clearCart();
      setPhone("");
      setCanton("");
      setDistrito("");
      setDireccionExacta("");
    } catch (error) {
      console.error("Error al generar el pedido:", error);
      toast.error("Ocurrió un error al generar el pedido. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (totalItems === 0 && !isOpen && !successMessage) return null;

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95"
          aria-label="Abrir carrito"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {totalItems}
          </span>
        </button>
      )}

      {/* Panel lateral */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed bottom-3 right-3 sm:right-6 z-50 flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                Tu Carrito ({totalItems})
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Vaciar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Cerrar carrito"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mensaje de éxito */}
            {successMessage && (
              <div className="flex items-start gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700 leading-relaxed">{successMessage}</p>
              </div>
            )}

            {/* Banner envío a convenir */}
            <div className="bg-emerald-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-bold">
              <Truck className="h-4 w-4 shrink-0 text-emerald-200" />
              <span>Precio de envío a convenir dependiendo del lugar 🚚</span>
            </div>

            {/* Lista de items + Formulario (scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Items */}
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-500">Tu carrito está vacío.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 border-b border-stone-100 pb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover border border-stone-200"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs font-bold text-stone-900 line-clamp-1">{item.nombre}</span>
                        <span className="text-xs font-semibold text-emerald-600">
                          ₡{item.precio.toLocaleString("es-CR")}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Formulario de Dirección (solo si hay items) */}
              {items.length > 0 && (
                <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 uppercase tracking-wider">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Dirección de Entrega
                  </div>

                  {/* Provincia */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Provincia</label>
                    <select
                      value={provincia}
                      onChange={(e) => handleProvinciaChange(e.target.value)}
                      className="rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    >
                      {Object.keys(CR_LOCATIONS).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cantón */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Cantón
                      {!canton && <span className="ml-1 text-rose-500 font-normal">*</span>}
                    </label>
                    <select
                      value={canton}
                      onChange={(e) => handleCantonChange(e.target.value)}
                      className="rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 disabled:opacity-50"
                      disabled={cantones.length === 0}
                    >
                      <option value="">— Selecciona cantón —</option>
                      {cantones.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Distrito */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Distrito
                      {canton && !distrito && <span className="ml-1 text-rose-500 font-normal">*</span>}
                    </label>
                    <select
                      value={distrito}
                      onChange={(e) => setDistrito(e.target.value)}
                      className="rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 disabled:opacity-50"
                      disabled={!canton || distritos.length === 0}
                    >
                      <option value="">
                        {!canton ? "— Primero selecciona cantón —" : "— Selecciona distrito —"}
                      </option>
                      {distritos.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* WhatsApp y Dirección exacta en grid */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      WhatsApp
                      {!phone && <span className="ml-1 text-rose-500 font-normal">*</span>}
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-200">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 88887777"
                        className="w-full bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Dirección exacta */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Dirección exacta / Señas
                      {!direccionExacta && <span className="ml-1 text-rose-500 font-normal">*</span>}
                    </label>
                    <textarea
                      rows={2}
                      value={direccionExacta}
                      onChange={(e) => setDireccionExacta(e.target.value)}
                      placeholder="Ej: De la iglesia 100m norte, casa blanca con portón negro..."
                      className="resize-none rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-xs text-stone-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2.5 border-t border-stone-100 bg-stone-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-stone-600">Subtotal</span>
                <span className="text-lg font-black text-stone-900">
                  ₡{subtotal.toLocaleString("es-CR")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>El costo de envío se acuerda dependiendo del lugar de entrega.</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateOrder}
                disabled={isGenerating || items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Phone className="h-4 w-4" />
                {isGenerating ? "Generando pedido..." : "Generar Pedido por WhatsApp"}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}