"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Upload,
  Loader2,
  CheckCircle2,
  LogOut,
  Trash2,
  PlusCircle,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagenes: string[];
  created_at?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Verificar sesión al montar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
      } else {
        setSession(session);
      }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  // Cargar productos
  const cargarProductos = useCallback(async () => {
    setLoadingProductos(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error al cargar productos:", error);
    }
    setProductos((data ?? []) as Product[]);
    setLoadingProductos(false);
  }, []);

  useEffect(() => {
    if (session) {
      cargarProductos();
    }
  }, [session, cargarProductos]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!nombre.trim() || !descripcion.trim() || !precio || !imagen) {
      setError("Por favor completa todos los campos y selecciona una imagen.");
      return;
    }

    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Subir imagen al bucket tienda-archivos en la subcarpeta productos/
      const filePath = `productos/${Date.now()}-${imagen.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tienda-archivos")
        .upload(filePath, imagen, {
          cacheControl: "3600",
          upsert: false,
          contentType: imagen.type,
        });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública de la imagen
      const { data: publicUrlData } = supabase.storage
        .from("tienda-archivos")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      // 3. Insertar producto en la tabla productos
      const { error: insertError } = await supabase.from("productos").insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNum,
        imagenes: [publicUrl],
        activo: true,
      });

      if (insertError) throw insertError;

      // 4. Limpiar formulario y mostrar éxito
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setImagen(null);
      setSuccess(true);

      // 5. Recargar la lista al instante
      cargarProductos();
      router.refresh();
    } catch (err: any) {
      console.error("Error al crear producto:", err);
      setError(err?.message || "Ocurrió un error al crear el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar producto:", error);
      alert("Ocurrió un error al eliminar el producto.");
      return;
    }
    cargarProductos();
    router.refresh();
  };

  // Mientras se verifica la sesión
  if (checking) {
    return (
      <main className="flex flex-1 items-center justify-center bg-stone-50 px-4 py-8">
        <div className="flex items-center gap-2 text-stone-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Verificando sesión...</span>
        </div>
      </main>
    );
  }

  // Si no hay sesión, no renderizar (se redirige en el useEffect)
  if (!session) return null;

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto bg-stone-50 px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
            <Package className="h-7 w-7 text-emerald-600" />
            Panel de Administración
          </h1>
          <p className="mt-1 text-stone-600">
            Gestiona los productos de la tienda.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Bloque 1: Formulario de creación */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-stone-900">Nuevo Producto</h2>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="nombre" className="text-sm font-medium text-stone-700">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bolso de Cuero Artesanal"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="descripcion" className="text-sm font-medium text-stone-700">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el producto..."
                rows={4}
                className="resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="precio" className="text-sm font-medium text-stone-700">
                Precio (₡)
              </label>
              <input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej. 45000"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="imagen" className="text-sm font-medium text-stone-700">
                Imagen principal
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-3">
                <ImageIcon className="h-5 w-5 shrink-0 text-stone-400" />
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}

            {success && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Producto creado exitosamente.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Crear Producto
                </>
              )}
            </button>
          </form>
        </section>

        {/* Bloque 2: Lista de productos */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-stone-900">
              Productos Actuales ({productos.length})
            </h2>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            {loadingProductos ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Cargando productos...</span>
              </div>
            ) : productos.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-stone-500">
                No hay productos creados todavía.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {productos.map((producto) => (
                  <li
                    key={producto.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      {producto.imagenes?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={producto.imagenes[0]}
                          alt={producto.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-stone-900">
                        {producto.nombre}
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        ₡{producto.precio.toLocaleString("es-CR")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(producto.id)}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}