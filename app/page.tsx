import ProductCard from "@/components/ProductCard";
import FloatingCart from "@/components/FloatingCart";
import CategorySidebar from "@/components/CategorySidebar";
import HeroBanner from "@/components/HeroBanner";
import PromoCarousel from "@/components/PromoCarousel";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { getPromos } from "@/lib/promoManager";
import { getSubcategories } from "@/lib/subcategoryManager";

export const dynamic = "force-dynamic";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  precioOriginal?: number;
  descripcion: string;
  imagenes: string[];
  categoria_id: string;
  subcategoria_id?: string | null;
  categoriaNombre?: string;
  subcategoriaNombre?: string;
}

interface Category {
  id: string;
  nombre: string;
  activo: boolean;
}

interface Subcategory {
  id: string;
  categoria_id: string;
  nombre: string;
  activo: boolean;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; subcategoria?: string }>;
}) {
  const params = await searchParams;
  const categoriaId = params.categoria;
  const subcategoriaId = params.subcategoria;

  let query = supabase.from("productos").select("*").eq("activo", true);

  if (categoriaId && categoriaId !== "all") {
    query = query.eq("categoria_id", categoriaId);
  }
  if (subcategoriaId) {
    query = query.eq("subcategoria_id", subcategoriaId);
  }

  const { data: productos, error } = await query.order("created_at", {
    ascending: false,
  });
  if (error) {
    console.error("Error al cargar productos:", error);
  }

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  const subcategorias = await getSubcategories();
  const promos = await getPromos();

  const allCategories: Category[] = (categorias ?? []).map((c: any) => ({
    id: c.id,
    nombre: c.nombre,
    activo: c.activo,
  }));

  const allSubcategories: Subcategory[] = subcategorias.map((s: any) => ({
    id: s.id,
    categoria_id: s.categoria_id,
    nombre: s.nombre,
    activo: s.activo,
  }));

  const catMap = new Map<string, string>();
  allCategories.forEach((c) => catMap.set(c.id, c.nombre));

  const subcatMap = new Map<string, string>();
  allSubcategories.forEach((s) => subcatMap.set(s.id, s.nombre));

  const products: Product[] = (productos ?? []).map((p: any) => {
    const activePromo = promos.find(promo => promo.producto_id === p.id);
    let finalPrice = p.precio;
    let originalPrice = undefined;

    if (activePromo) {
      originalPrice = p.precio;
      finalPrice = Math.round(p.precio * (1 - activePromo.descuento / 100));
    }

    return {
      id: p.id,
      nombre: p.nombre,
      precio: finalPrice,
      precioOriginal: originalPrice,
      descripcion: p.descripcion || "",
      imagenes: Array.isArray(p.imagenes) ? p.imagenes : [],
      categoria_id: p.categoria_id,
      subcategoria_id: p.subcategoria_id,
      categoriaNombre: catMap.get(p.categoria_id),
      subcategoriaNombre: p.subcategoria_id ? subcatMap.get(p.subcategoria_id) : undefined,
    };
  });

  let currentCategoryName = "Todos los productos";
  if (categoriaId && categoriaId !== "all") {
    const catObj = allCategories.find((c) => c.id === categoriaId);
    if (catObj) {
      currentCategoryName = catObj.nombre;
      if (subcategoriaId) {
        const subcatObj = allSubcategories.find((s) => s.id === subcategoriaId);
        if (subcatObj) {
          currentCategoryName += ` — ${subcatObj.nombre}`;
        }
      }
    }
  }

  return (
    <main className="flex-1 w-full bg-stone-50">
      {/* 1. Hero Banner */}
      <HeroBanner
        categories={allCategories}
        subcategories={allSubcategories}
        products={products}
      />

      {/* 2. Carrusel de Promociones */}
      <PromoCarousel items={promos} />

      {/* 3. Contenido principal con Categorías y Subcategorías */}
      <div id="productos" className="relative w-full">
        {/* Barra de Categorías Horizontal */}
        <CategorySidebar
          categories={allCategories}
          subcategories={allSubcategories}
          selectedCategoryId={categoriaId ?? "all"}
          selectedSubcategoryId={subcategoriaId}
        />

        {/* Cuadrícula de Productos */}
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-stone-900 sm:text-2xl">
                {currentCategoryName}
              </h2>
              <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
                {products.length} producto(s) disponible(s)
              </p>
            </div>
          </header>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-20 text-center shadow-sm">
              <p className="text-stone-500 font-medium">
                No hay productos disponibles en esta sección.
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Prueba seleccionando otra categoría o subcategoría. ✨
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </section>
          )}
        </div>
      </div>

      <UserMenu />
      <FloatingCart />
    </main>
  );
}