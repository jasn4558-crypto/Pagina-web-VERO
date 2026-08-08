import ProductCard from "@/components/ProductCard";
import FloatingCart from "@/components/FloatingCart";
import CategorySidebar from "@/components/CategorySidebar";
import HeroBanner from "@/components/HeroBanner";
import PromoCarousel from "@/components/PromoCarousel";
import ViewToggle from "@/components/ViewToggle";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { getPromos } from "@/lib/promoManager";

// Siempre consulta la base de datos fresca (evita caché agresiva de Server Components)
export const dynamic = "force-dynamic";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagenes: string[];
  categoria_id: string;
}

interface Category {
  id: string;
  nombre: string;
  activo: boolean;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const params = await searchParams;
  const categoriaId = params.categoria;

  let query = supabase.from("productos").select("*").eq("activo", true);
  if (categoriaId) {
    query = query.eq("categoria_id", categoriaId);
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

  const promos = await getPromos();

  const products: Product[] = (productos ?? []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    descripcion: p.descripcion,
    imagenes: Array.isArray(p.imagenes) ? p.imagenes : [],
    categoria_id: p.categoria_id,
  }));

  const allCategories: Category[] = [
    ...(categorias ?? []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      activo: c.activo,
    })),
  ];

  const currentCategoryName = categoriaId
    ? allCategories.find((c) => c.id === categoriaId)?.nombre ?? "Productos"
    : "Todos los productos";

  return (
    <main className="flex-1 w-full bg-stone-50">
      {/* 1. Hero Banner */}
      <HeroBanner categories={allCategories} products={products} />

      {/* 2. Carrusel de Promociones */}
      <PromoCarousel items={promos} />

      {/* 3. Contenido principal con Categorías Horizontales Arriba */}
      <div id="productos" className="relative w-full">
        {/* Barra de Categorías Horizontal (Sticky Top) */}
        <CategorySidebar
          categories={allCategories}
          selectedId={categoriaId ?? "all"}
        />

        {/* Cuadrícula de Productos (2 col en móvil, 3 en md, 4 en lg) */}
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
                No hay productos disponibles en esta categoría.
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Prueba seleccionando otra categoría o vuelve pronto. ✨
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