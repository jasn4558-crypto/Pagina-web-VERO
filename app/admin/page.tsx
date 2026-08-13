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
  Pencil,
  Tags,
  Tag,
  ClipboardList,
  Save,
  X,
  LayoutTemplate,
  Sparkles,
  Download,
  Eye,
  ZoomIn,
  ToggleLeft,
  ToggleRight,
  Clipboard,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getHeaderConfig, saveHeaderConfig, HeaderConfig } from "@/lib/configManager";
import { generateOrderPDF } from "@/lib/pdfGenerator";
import ProductImageEditor from "@/components/ProductImageEditor";
import { getCurrentUserSession, logoutUserSession } from "@/lib/authManager";
import { getAllPromos, upsertPromo, deletePromo, togglePromo, PromoRecord } from "@/lib/promoManager";
import {
  getAllSubcategoriesAdmin,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  SubcategoryRecord,
} from "@/lib/subcategoryManager";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagenes: string[];
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  created_at?: string;
}

interface Category {
  id: string;
  nombre: string;
  activo: boolean;
}

interface Order {
  id: string;
  telefono: string;
  total: number;
  estado: string;
  items: any[];
  created_at?: string;
}

type Tab = "productos" | "categorias" | "pedidos" | "encabezado" | "promociones";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("productos");

  // Productos
  const [productos, setProductos] = useState<Product[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoryRecord[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [imagenesExistentes, setImagenesExistentes] = useState<string[]>([]);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Control de orden de imágenes existentes
  const setAsPrincipal = (index: number) => {
    setImagenesExistentes((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    setImagenesExistentes((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveRight = (index: number) => {
    setImagenesExistentes((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const removeExistingImage = (index: number) => {
    setImagenesExistentes((prev) => prev.filter((_, i) => i !== index));
  };

  // Categorías & Subcategorías
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<string | null>(null);
  const [editandoCategoriaNombre, setEditandoCategoriaNombre] = useState("");
  const [nuevaSubcatCatId, setNuevaSubcatCatId] = useState("");
  const [nuevaSubcatNombre, setNuevaSubcatNombre] = useState("");
  const [editandoSubcatId, setEditandoSubcatId] = useState<string | null>(null);
  const [editandoSubcatNombre, setEditandoSubcatNombre] = useState("");

  // Pedidos
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [selectedOrderImages, setSelectedOrderImages] = useState<Order | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const getNumPedido = (pedido: Order, indexInDesc: number) => {
    if (pedido.items?.[0]?.numero_pedido) {
      return String(pedido.items[0].numero_pedido);
    }
    const oldestIndex = Math.max(0, pedidos.length - 1 - indexInDesc);
    const num = 421 + oldestIndex;
    return String(num).padStart(7, "0");
  };

  // Editor de imagen por producto
  const [editorProduct, setEditorProduct] = useState<Product | null>(null);
  const [editingNewFile, setEditingNewFile] = useState<File | null>(null);
  const [editingNewFileIndex, setEditingNewFileIndex] = useState<number | null>(null);

  // Promociones
  const [promos, setPromos] = useState<PromoRecord[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [promoProductId, setPromoProductId] = useState("");
  const [promoDescuento, setPromoDescuento] = useState("10");
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  // Encabezado
  const [headerBadgeText, setHeaderBadgeText] = useState("");
  const [headerTituloPrincipal, setHeaderTituloPrincipal] = useState("");
  const [headerTituloDestacado, setHeaderTituloDestacado] = useState("");
  const [headerDescripcion, setHeaderDescripcion] = useState("");
  const [headerBotonTexto, setHeaderBotonTexto] = useState("");
  const [savingHeader, setSavingHeader] = useState(false);
  const [headerSuccess, setHeaderSuccess] = useState(false);

  const cargarHeaderConfig = useCallback(async () => {
    const config = await getHeaderConfig();
    setHeaderBadgeText(config.badge_text);
    setHeaderTituloPrincipal(config.titulo_principal);
    setHeaderTituloDestacado(config.titulo_destacado);
    setHeaderDescripcion(config.descripcion);
    setHeaderBotonTexto(config.boton_texto);
  }, []);

  const handleGuardarHeader = async (e: FormEvent) => {
    e.preventDefault();
    setSavingHeader(true);
    setHeaderSuccess(false);

    await saveHeaderConfig({
      badge_text: headerBadgeText.trim(),
      titulo_principal: headerTituloPrincipal.trim(),
      titulo_destacado: headerTituloDestacado.trim(),
      descripcion: headerDescripcion.trim(),
      boton_texto: headerBotonTexto.trim(),
    });

    setSavingHeader(false);
    setHeaderSuccess(true);
    setTimeout(() => setHeaderSuccess(false), 3000);
  };

  // Verificar sesión al montar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: supaSession } } = await supabase.auth.getSession();
      const localUser = getCurrentUserSession();
      if (!supaSession && localUser?.rol !== "admin") {
        router.push("/admin/login");
      } else {
        setSession(supaSession || localUser);
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

  // Cargar categorías y subcategorías
  const cargarCategorias = useCallback(async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("nombre");
    if (error) {
      console.error("Error al cargar categorías:", error);
    }
    setCategorias((data ?? []) as Category[]);
  }, []);

  const cargarSubcategorias = useCallback(async () => {
    const data = await getAllSubcategoriesAdmin();
    setSubcategorias(data);
  }, []);

  // Cargar pedidos
  const cargarPedidos = useCallback(async () => {
    setLoadingPedidos(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error al cargar pedidos:", error);
    }
    setPedidos((data ?? []) as Order[]);
    setLoadingPedidos(false);
  }, []);

  useEffect(() => {
    if (session) {
      cargarProductos();
      cargarCategorias();
      cargarSubcategorias();
      cargarPedidos();
      cargarHeaderConfig();
      getAllPromos().then(setPromos);
    }
  }, [session, cargarProductos, cargarCategorias, cargarSubcategorias, cargarPedidos, cargarHeaderConfig]);

  const handleSignOut = async () => {
    logoutUserSession();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  // ===== PRODUCTOS =====
  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategoriaId("");
    setSubcategoriaId("");
    setImagenesExistentes([]);
    setImagenes([]);
    setEditandoId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!nombre.trim() || !descripcion.trim() || !precio) {
      setError("Por favor completa nombre, descripción y precio.");
      return;
    }

    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      let urlsNuevasImagenes: string[] = [];

      // Subir nuevas imágenes si hay
      if (imagenes.length > 0) {
        for (const file of imagenes) {
          const filePath = `productos/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("tienda-archivos")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage
            .from("tienda-archivos")
            .getPublicUrl(filePath);
          urlsNuevasImagenes.push(publicUrlData.publicUrl);
        }
      }

      // Combinar imágenes conservadas/reordenadas + nuevas imágenes subidas
      const finalImagenes = [...imagenesExistentes, ...urlsNuevasImagenes];

      if (finalImagenes.length === 0) {
        setError("El producto debe conservar o incluir al menos una imagen.");
        setIsSubmitting(false);
        return;
      }

      if (editandoId) {
        // UPDATE
        const { error: updateError } = await supabase
          .from("productos")
          .update({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precio: precioNum,
            categoria_id: categoriaId || null,
            subcategoria_id: subcategoriaId || null,
            imagenes: finalImagenes,
          })
          .eq("id", editandoId);
        if (updateError) throw updateError;
      } else {
        // INSERT
        const { error: insertError } = await supabase.from("productos").insert({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precio: precioNum,
          categoria_id: categoriaId || null,
          subcategoria_id: subcategoriaId || null,
          imagenes: finalImagenes,
          activo: true,
        });
        if (insertError) throw insertError;
      }

      resetForm();
      setSuccess(true);
      cargarProductos();
      router.refresh();
    } catch (err: any) {
      console.error("Error al guardar producto:", err);
      setError(err?.message || "Ocurrió un error al guardar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (producto: Product) => {
    setEditandoId(producto.id);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(String(producto.precio));
    setCategoriaId(producto.categoria_id ?? "");
    setSubcategoriaId(producto.subcategoria_id ?? "");
    setImagenesExistentes(Array.isArray(producto.imagenes) ? [...producto.imagenes] : []);
    setImagenes([]);
    setError("");
    setSuccess(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar producto:", error);
      alert("Ocurrió un error al eliminar el producto.");
      return;
    }
    if (editandoId === id) resetForm();
    cargarProductos();
    router.refresh();
  };

  // ===== CATEGORÍAS =====
  const handleCrearCategoria = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;

    const { error } = await supabase.from("categorias").insert({
      nombre: nuevaCategoria.trim(),
      activo: true,
    });
    if (error) {
      console.error("Error al crear categoría:", error);
      alert("Ocurrió un error al crear la categoría.");
      return;
    }
    setNuevaCategoria("");
    cargarCategorias();
    router.refresh();
  };

  const handleEditarCategoria = async (id: string) => {
    if (!editandoCategoriaNombre.trim()) return;

    const { error } = await supabase
      .from("categorias")
      .update({ nombre: editandoCategoriaNombre.trim() })
      .eq("id", id);
    if (error) {
      console.error("Error al editar categoría:", error);
      alert("Ocurrió un error al editar la categoría.");
      return;
    }
    setEditandoCategoriaId(null);
    setEditandoCategoriaNombre("");
    cargarCategorias();
    router.refresh();
  };

  const handleEliminarCategoria = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría? Los productos asociados quedarán sin categoría.")) return;

    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar categoría:", error);
      alert("Ocurrió un error al eliminar la categoría.");
      return;
    }
    cargarCategorias();
    router.refresh();
  };

  // Subcategorías Handlers
  const handleCrearSubcategoria = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevaSubcatCatId || !nuevaSubcatNombre.trim()) return;

    try {
      await createSubcategory(nuevaSubcatCatId, nuevaSubcatNombre.trim());
      setNuevaSubcatNombre("");
      cargarSubcategorias();
      router.refresh();
    } catch (err) {
      alert("Error al crear la subcategoría. Asegúrate de haber ejecutado el SQL en Supabase.");
    }
  };

  const handleEditarSubcategoria = async (id: string) => {
    if (!editandoSubcatNombre.trim()) return;
    const ok = await updateSubcategory(id, { nombre: editandoSubcatNombre.trim() });
    if (ok) {
      setEditandoSubcatId(null);
      setEditandoSubcatNombre("");
      cargarSubcategorias();
      router.refresh();
    } else {
      alert("Error al editar la subcategoría.");
    }
  };

  const handleEliminarSubcategoria = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta subcategoría?")) return;
    const ok = await deleteSubcategory(id);
    if (ok) {
      cargarSubcategorias();
      router.refresh();
    } else {
      alert("Error al eliminar la subcategoría.");
    }
  };

  // ===== PEDIDOS =====
  const handleCambiarEstado = async (id: string, estado: string) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ estado })
      .eq("id", id);
    if (error) {
      console.error("Error al actualizar estado del pedido:", error);
      alert("Ocurrió un error al actualizar el estado.");
      return;
    }
    cargarPedidos();
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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "productos", label: "Productos", icon: Package },
    { id: "categorias", label: "Categorías", icon: Tags },
    { id: "pedidos", label: "Pedidos", icon: ClipboardList },
    { id: "promociones", label: "Promociones", icon: Tag },
    { id: "encabezado", label: "Encabezado", icon: LayoutTemplate },
  ];

  return (
    <>
    <main className="flex-1 w-full max-w-7xl mx-auto bg-stone-50 px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
            <Package className="h-7 w-7 text-emerald-600" />
            Panel de Administración
          </h1>
          <p className="mt-1 text-stone-600">
            Gestiona productos, categorías, pedidos y encabezados de la tienda.
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

      {/* Tabs */}
      <nav className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ===== VISTA PRODUCTOS ===== */}
      {activeTab === "productos" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Formulario */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-stone-900">
                {editandoId ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              {editandoId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100"
                >
                  <X className="h-3 w-3" />
                  Cancelar edición
                </button>
              )}
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
                <label htmlFor="categoria" className="text-sm font-medium text-stone-700">
                  Categoría
                </label>
                <select
                  id="categoria"
                  value={categoriaId}
                  onChange={(e) => {
                    setCategoriaId(e.target.value);
                    setSubcategoriaId("");
                  }}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="subcategoria" className="text-sm font-medium text-stone-700">
                  Subcategoría
                </label>
                <select
                  id="subcategoria"
                  value={subcategoriaId}
                  disabled={!categoriaId}
                  onChange={(e) => setSubcategoriaId(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                >
                  <option value="">Sin subcategoría</option>
                  {subcategorias
                    .filter((s) => s.categoria_id === categoriaId)
                    .map((subcat) => (
                      <option key={subcat.id} value={subcat.id}>
                        {subcat.nombre}
                      </option>
                    ))}
                </select>
              </div>

              {/* IMÁGENES GUARDADAS ACTUALES */}
              {imagenesExistentes.length > 0 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Imágenes actuales ({imagenesExistentes.length})
                    </span>
                    <span className="text-[11px] font-medium text-stone-500">
                      La 1ª es la <strong className="text-emerald-700 font-bold">Principal</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                    {imagenesExistentes.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group shrink-0 flex flex-col items-center rounded-xl border-2 bg-white p-1.5 shadow-sm transition-all ${
                          idx === 0 ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-stone-200"
                        }`}
                      >
                        {/* Badge Principal u Orden */}
                        {idx === 0 ? (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm whitespace-nowrap">
                            ★ Principal
                          </span>
                        ) : (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-stone-700 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                            #{idx + 1}
                          </span>
                        )}

                        {/* Thumbnail */}
                        <div className="h-20 w-20 overflow-hidden rounded-lg bg-stone-100 mt-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                        </div>

                        {/* Botones de control */}
                        <div className="mt-2 flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => setAsPrincipal(idx)}
                              className="rounded-lg bg-emerald-50 px-1.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              title="Hacer imagen principal"
                            >
                              ★
                            </button>
                          )}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => moveLeft(idx)}
                              className="rounded-lg bg-stone-100 px-1.5 py-1 text-[10px] font-bold text-stone-700 hover:bg-stone-200"
                              title="Mover a la izquierda"
                            >
                              ←
                            </button>
                          )}
                          {idx < imagenesExistentes.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveRight(idx)}
                              className="rounded-lg bg-stone-100 px-1.5 py-1 text-[10px] font-bold text-stone-700 hover:bg-stone-200"
                              title="Mover a la derecha"
                            >
                              →
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx)}
                            className="rounded-lg bg-rose-50 px-1.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100 border border-rose-200"
                            title="Eliminar esta foto"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="imagenes" className="text-sm font-medium text-stone-700">
                  {imagenesExistentes.length > 0 ? "Agregar más imágenes (opcional)" : "Imágenes del producto (puedes seleccionar varias)"}
                </label>

                {/* Botón: Pegar desde portapapeles */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (!navigator.clipboard?.read) {
                        toast.error("Usa Ctrl+V en el editor de imagen para pegar desde el portapapeles.");
                        return;
                      }
                      const clipItems = await navigator.clipboard.read();
                      let found = false;
                      for (const item of clipItems) {
                        const imgType = item.types.find((t) => t.startsWith("image/"));
                        if (imgType) {
                          const blob = await item.getType(imgType);
                          const pastedFile = new File([blob], `portapapeles-${Date.now()}.png`, { type: imgType });
                          setImagenes((prev) => [...prev, pastedFile]);
                          toast.success("¡Imagen pegada desde el portapapeles!");
                          found = true;
                          break;
                        }
                      }
                      if (!found) toast.error("No se encontró imagen en el portapapeles. Copia una imagen e intenta de nuevo.");
                    } catch {
                      toast.error("Sin permiso para el portapapeles. Usa Ctrl+V en el editor de imagen.");
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <Clipboard className="h-4 w-4" />
                  Pegar imagen desde Portapapeles (Ctrl+V)
                </button>

                {/* Input de archivos */}
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-3">
                  <ImageIcon className="h-5 w-5 shrink-0 text-stone-400" />
                  <input
                    id="imagenes"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImagenes((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
                    className="w-full text-sm text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
                  />
                </div>
                {imagenes.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    <p className="text-xs font-semibold text-stone-600">
                      {imagenes.length} nueva(s) imagen(es) — Toca &quot;Editar&quot; para retocar:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {imagenes.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2">
                          <span className="max-w-[100px] truncate text-xs text-stone-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNewFile(file);
                              setEditingNewFileIndex(idx);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setImagenes((prev) => prev.filter((_, i) => i !== idx))}
                            className="rounded-lg bg-rose-50 px-1.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100"
                            title="Quitar imagen"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </p>
              )}

              {success && (
                <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {editandoId ? "Producto actualizado exitosamente." : "Producto creado exitosamente."}
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
                ) : editandoId ? (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
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

          {/* Lista de productos */}
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
                    <li key={producto.id} className="flex items-center gap-3 px-4 py-3">
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
                        <span className="text-xs text-stone-400">
                          {categorias.find((c) => c.id === producto.categoria_id)?.nombre ?? "Sin categoría"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditorProduct(producto)}
                        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(producto)}
                        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
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
      )}

      {/* ===== VISTA CATEGORÍAS ===== */}
      {activeTab === "categorias" && (
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-2">
            <Tags className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-stone-900">Categorías</h2>
          </div>

          {/* Formulario crear categoría */}
          <form
            onSubmit={handleCrearCategoria}
            className="mb-6 flex gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <input
              type="text"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              placeholder="Nombre de la nueva categoría..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={!nuevaCategoria.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              Agregar
            </button>
          </form>

          {/* Lista de categorías */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            {categorias.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-stone-500">
                No hay categorías creadas todavía.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {categorias.map((cat) => (
                  <li key={cat.id} className="flex items-center gap-3 px-4 py-3">
                    {editandoCategoriaId === cat.id ? (
                      <>
                        <input
                          type="text"
                          value={editandoCategoriaNombre}
                          onChange={(e) => setEditandoCategoriaNombre(e.target.value)}
                          className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleEditarCategoria(cat.id)}
                          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                        >
                          <Save className="h-4 w-4" />
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoCategoriaId(null);
                            setEditandoCategoriaNombre("");
                          }}
                          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-stone-900">
                          {cat.nombre}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoCategoriaId(cat.id);
                            setEditandoCategoriaNombre(cat.nombre);
                          }}
                          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarCategoria(cat.id)}
                          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ===== SECCIÓN SUBCATEGORÍAS ===== */}
          <div className="mt-8 mb-4 flex items-center gap-2 border-t border-stone-200 pt-6">
            <Tag className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-stone-900">Subcategorías</h2>
          </div>

          {/* Formulario crear subcategoría */}
          <form
            onSubmit={handleCrearSubcategoria}
            className="mb-6 flex flex-col sm:flex-row gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <select
              value={nuevaSubcatCatId}
              onChange={(e) => setNuevaSubcatCatId(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Selecciona Categoría...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={nuevaSubcatNombre}
              onChange={(e) => setNuevaSubcatNombre(e.target.value)}
              placeholder="Nombre de subcategoría (ej. Zapatos, Ropa)..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={!nuevaSubcatCatId || !nuevaSubcatNombre.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              Agregar Subcategoría
            </button>
          </form>

          {/* Lista de subcategorías */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            {subcategorias.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-500">
                No hay subcategorías creadas todavía.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {subcategorias.map((subcat) => {
                  const parentCat = categorias.find((c) => c.id === subcat.categoria_id);
                  return (
                    <li key={subcat.id} className="flex items-center gap-3 px-4 py-3">
                      {editandoSubcatId === subcat.id ? (
                        <>
                          <input
                            type="text"
                            value={editandoSubcatNombre}
                            onChange={(e) => setEditandoSubcatNombre(e.target.value)}
                            className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditarSubcategoria(subcat.id)}
                            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                          >
                            <Save className="h-4 w-4" />
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoSubcatId(null);
                              setEditandoSubcatNombre("");
                            }}
                            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-1 flex-col">
                            <span className="text-sm font-medium text-stone-900">
                              {subcat.nombre}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">
                              Categoría: {parentCat?.nombre || "N/A"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoSubcatId(subcat.id);
                              setEditandoSubcatNombre(subcat.nombre);
                            }}
                            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarSubcategoria(subcat.id)}
                            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ===== VISTA PEDIDOS ===== */}
      {activeTab === "pedidos" && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-stone-900">
                Pedidos ({pedidos.length})
              </h2>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            {loadingPedidos ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Cargando pedidos...</span>
              </div>
            ) : pedidos.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-stone-500">
                No hay pedidos registrados todavía.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                      <th className="px-4 py-3 font-medium">N° Pedido</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Teléfono</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">PDF / Cotización</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {pedidos.map((pedido, index) => {
                      const numPedidoStr = getNumPedido(pedido, index);
                      const isGeneratingThis = generatingPdfId === pedido.id;
                      return (
                        <tr key={pedido.id}>
                          <td className="px-4 py-3 font-bold text-stone-900">
                            #{numPedidoStr}
                          </td>
                          <td className="px-4 py-3 text-stone-600">
                            {pedido.created_at
                              ? new Date(pedido.created_at).toLocaleString("es-CR")
                              : "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-stone-900">
                            {pedido.telefono}
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">
                            ₡{pedido.total.toLocaleString("es-CR")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <ul className="flex flex-col gap-0.5">
                                {(pedido.items ?? []).map((item: any, i: number) => (
                                  <li key={i} className="text-xs text-stone-600 font-medium">
                                    {item.nombre} × {item.cantidad}
                                  </li>
                                ))}
                              </ul>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderImages(pedido)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                              >
                                <ZoomIn className="h-3.5 w-3.5" />
                                Ver / Ampliar Imágenes
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={pedido.estado}
                              onChange={(e) => handleCambiarEstado(pedido.id, e.target.value)}
                              className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${
                                pedido.estado === "completado"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : pedido.estado === "cancelado"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="completado">Completado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={isGeneratingThis}
                              onClick={async () => {
                                setGeneratingPdfId(pedido.id);
                                try {
                                  await generateOrderPDF({
                                    ...pedido,
                                    numero_pedido: numPedidoStr,
                                  });
                                } finally {
                                  setGeneratingPdfId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                              {isGeneratingThis ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              {isGeneratingThis ? "Generando..." : "Descargar PDF"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Modal para ampliar imágenes del pedido */}
      {selectedOrderImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Imágenes del Pedido #{getNumPedido(selectedOrderImages, pedidos.findIndex(p => p.id === selectedOrderImages.id))}
                </h3>
                <p className="text-xs text-stone-500">
                  Cliente: {selectedOrderImages.telefono} — Total: ₡{selectedOrderImages.total.toLocaleString("es-CR")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderImages(null)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {(selectedOrderImages.items ?? []).map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-stone-200">
                    {item.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{item.nombre}</h4>
                    <p className="text-xs text-stone-500">Cantidad: {item.cantidad || 1}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderImages(null)}
                className="rounded-full bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== VISTA PROMOCIONES ===== */}
      {activeTab === "promociones" && (
        <section className="mx-auto max-w-3xl space-y-6">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-stone-900">Promociones del Carrusel</h2>
          </div>

          {/* Formulario para agregar promo */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-stone-800">Agregar producto al carrusel de ofertas</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">Selecciona un Producto</label>
                <select
                  value={promoProductId}
                  onChange={(e) => setPromoProductId(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">-- Elige un producto --</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} · ₡{p.precio.toLocaleString("es-CR")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">
                  Descuento (%) — El precio nuevo se calcula automáticamente
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="90"
                    value={promoDescuento}
                    onChange={(e) => setPromoDescuento(e.target.value)}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="w-14 text-center rounded-xl border border-emerald-200 bg-emerald-50 py-1 text-sm font-extrabold text-emerald-700">
                    -{promoDescuento}%
                  </span>
                </div>
                {promoProductId && (() => {
                  const prod = productos.find((p) => p.id === promoProductId);
                  if (!prod) return null;
                  const nuevo = Math.round(prod.precio * (1 - Number(promoDescuento) / 100));
                  return (
                    <p className="text-xs text-stone-500">
                      Precio original: <span className="line-through">₡{prod.precio.toLocaleString("es-CR")}</span>
                      {" → "}
                      <span className="font-bold text-emerald-700">₡{nuevo.toLocaleString("es-CR")}</span>
                    </p>
                  );
                })()}
              </div>

              {promoError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">{promoError}</p>
              )}
              {promoSuccess && (
                <p className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4" /> {promoSuccess}
                </p>
              )}

              <button
                type="button"
                disabled={savingPromo || !promoProductId}
                onClick={async () => {
                  setPromoError("");
                  setPromoSuccess("");
                  const prod = productos.find((p) => p.id === promoProductId);
                  if (!prod) return;
                  setSavingPromo(true);
                  try {
                    await upsertPromo({
                      producto_id: prod.id,
                      nombre: prod.nombre,
                      imagen: prod.imagenes?.[0] ?? "",
                      precio_original: prod.precio,
                      descuento: Number(promoDescuento),
                      activo: true,
                      orden: promos.length + 1,
                    });
                    setPromoSuccess("¡Producto agregado al carrusel!");
                    setPromoProductId("");
                    setPromoDescuento("10");
                    const updated = await getAllPromos();
                    setPromos(updated);
                  } catch (err: any) {
                    setPromoError(err?.message || "Error al guardar.");
                  } finally {
                    setSavingPromo(false);
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                {savingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Agregar al Carrusel de Ofertas
              </button>
            </div>
          </div>

          {/* Lista de promos */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="text-sm font-bold text-stone-800">Productos en el carrusel ({promos.length})</span>
              <button
                type="button"
                onClick={async () => {
                  setLoadingPromos(true);
                  const data = await getAllPromos();
                  setPromos(data);
                  setLoadingPromos(false);
                }}
                className="text-xs text-emerald-600 hover:underline"
              >
                Actualizar lista
              </button>
            </div>

            {loadingPromos ? (
              <div className="flex items-center justify-center gap-2 py-8 text-stone-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Cargando...</span>
              </div>
            ) : promos.length === 0 ? (
              <p className="py-8 text-center text-xs text-stone-500">No hay productos en el carrusel todavía.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {promos.map((promo) => {
                  const nuevo = Math.round(promo.precio_original * (1 - promo.descuento / 100));
                  return (
                    <li key={promo.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {promo.imagen ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={promo.imagen} alt={promo.nombre} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-stone-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-stone-900">{promo.nombre}</span>
                        <span className="text-xs">
                          <span className="text-stone-400 line-through">₡{promo.precio_original.toLocaleString("es-CR")}</span>
                          {" → "}
                          <span className="font-bold text-emerald-700">₡{nuevo.toLocaleString("es-CR")}</span>
                          <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold text-red-600">
                            -{promo.descuento}%
                          </span>
                        </span>
                      </div>
                      <button
                        type="button"
                        title={promo.activo ? "Desactivar" : "Activar"}
                        onClick={async () => {
                          await togglePromo(promo.id, !promo.activo);
                          setPromos((prev) => prev.map((p) => (p.id === promo.id ? { ...p, activo: !p.activo } : p)));
                        }}
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition ${
                          promo.activo
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        {promo.activo ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        {promo.activo ? "Activa" : "Inactiva"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("¿Eliminar esta promoción del carrusel?")) return;
                          await deletePromo(promo.id);
                          setPromos((prev) => prev.filter((p) => p.id !== promo.id));
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ===== VISTA ENCABEZADO ===== */}
      {activeTab === "encabezado" && (
        <section className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-stone-900">
              Personalizar Encabezado de la Tienda
            </h2>
          </div>

          <form
            onSubmit={handleGuardarHeader}
            className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="badgeText" className="text-sm font-medium text-stone-700">
                Insignia Superior (Badge)
              </label>
              <input
                id="badgeText"
                type="text"
                value={headerBadgeText}
                onChange={(e) => setHeaderBadgeText(e.target.value)}
                placeholder="Ej. Experiencia de Compra Inmersiva"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="text-xs text-stone-400">
                Pequeño texto destacado en la parte superior del encabezado.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="tituloPrincipal" className="text-sm font-medium text-stone-700">
                  Título Principal
                </label>
                <input
                  id="tituloPrincipal"
                  type="text"
                  value={headerTituloPrincipal}
                  onChange={(e) => setHeaderTituloPrincipal(e.target.value)}
                  placeholder="Ej. Catálogo"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="tituloDestacado" className="text-sm font-medium text-stone-700">
                  Título Destacado (Verde)
                </label>
                <input
                  id="tituloDestacado"
                  type="text"
                  value={headerTituloDestacado}
                  onChange={(e) => setHeaderTituloDestacado(e.target.value)}
                  placeholder="Ej. Esencial"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="headerDescripcion" className="text-sm font-medium text-stone-700">
                Descripción del Encabezado
              </label>
              <textarea
                id="headerDescripcion"
                value={headerDescripcion}
                onChange={(e) => setHeaderDescripcion(e.target.value)}
                placeholder="Describe tu tienda o mensaje principal..."
                rows={3}
                className="resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="headerBotonTexto" className="text-sm font-medium text-stone-700">
                Texto del Botón de Acción
              </label>
              <input
                id="headerBotonTexto"
                type="text"
                value={headerBotonTexto}
                onChange={(e) => setHeaderBotonTexto(e.target.value)}
                placeholder="Ej. Ver Catálogo"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {headerSuccess && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                ¡Encabezado guardado correctamente!
              </p>
            )}

            <button
              type="submit"
              disabled={savingHeader}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingHeader ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Encabezado
                </>
              )}
            </button>
          </form>
        </section>
      )}
    </main>

    {/* ===== EDITOR DE IMAGEN EXISTENTE ===== */}
    {editorProduct && (
      <ProductImageEditor
        productId={editorProduct.id}
        productName={editorProduct.nombre}
        existingImages={editorProduct.imagenes}
        onClose={() => setEditorProduct(null)}
        onSaved={() => {
          cargarProductos();
          setEditorProduct(null);
        }}
      />
    )}

    {/* ===== EDITOR DE IMAGEN NUEVA SIN PUBLICAR ===== */}
    {editingNewFile && editingNewFileIndex !== null && (
      <ProductImageEditor
        productId="nuevo"
        productName={nombre || "Nuevo Producto"}
        existingImages={[]}
        initialImageFile={editingNewFile}
        onClose={() => {
          setEditingNewFile(null);
          setEditingNewFileIndex(null);
        }}
        onSaved={() => {}}
        onSaveNewFile={(newFile) => {
          setImagenes((prev) => {
            const updated = [...prev];
            updated[editingNewFileIndex] = newFile;
            return updated;
          });
          setEditingNewFile(null);
          setEditingNewFileIndex(null);
        }}
      />
    )}
    </>
  );
}