import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Product } from "../backend.d";
import { Variant_twoHours_twoDays } from "../backend.d";
import ProductCard from "../components/ProductCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";

type ProductWithId = Product & { id: bigint };

export default function ShopPage() {
  const { actor } = useActor();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [delivery, setDelivery] = useState(
    searchParams.get("delivery") || "all",
  );
  const [priceMax, setPriceMax] = useState<number>(10000);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .getProducts()
      .then((ps) => {
        const withIds: ProductWithId[] = ps
          .filter((p) => p.isActive)
          .map((p, i) => ({ ...p, id: BigInt(i) }));
        setProducts(withIds);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchDelivery =
        delivery === "all" || (p.deliveryType as string) === delivery;
      const matchPrice = Number(p.price) / 100 <= priceMax;
      return matchSearch && matchDelivery && matchPrice;
    });
  }, [products, search, delivery, priceMax]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (delivery !== "all") params.delivery = delivery;
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F2A3A] mb-2">All Products</h1>
        <p className="text-[#6B7280]">
          Browse our full range of refrigerant spare parts
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 mb-8">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="pl-9"
            />
          </div>
          <Button type="submit" className="bg-[#0B5EA8] hover:bg-[#0951a0]">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </form>

        {showFilters && (
          <div className="flex flex-wrap gap-6 pt-4 border-t border-[#E5EAF0]">
            <div>
              <p className="text-sm font-medium text-[#2B2F33] mb-2">
                Delivery Type
              </p>
              <div className="flex gap-2">
                {[
                  { value: "all", label: "All" },
                  {
                    value: Variant_twoHours_twoDays.twoHours,
                    label: "2 Hours",
                  },
                  { value: Variant_twoHours_twoDays.twoDays, label: "2 Days" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setDelivery(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      delivery === opt.value
                        ? "bg-[#0B5EA8] text-white border-[#0B5EA8]"
                        : "bg-white text-[#2B2F33] border-[#E5EAF0] hover:border-[#0B5EA8]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2B2F33] mb-2">
                Max Price: ${priceMax.toFixed(0)}
              </p>
              <input
                type="range"
                min={0}
                max={10000}
                step={50}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-48"
              />
            </div>
            {(search || delivery !== "all" || priceMax < 10000) && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setDelivery("all");
                    setPriceMax(10000);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4 mr-1" /> Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7280]">
          {filtered.length} products found
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, i) => `skeleton-${i}`).map((key) => (
            <div
              key={key}
              className="bg-white rounded-2xl border border-[#E5EAF0] h-72 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#6B7280]">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id.toString()} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
