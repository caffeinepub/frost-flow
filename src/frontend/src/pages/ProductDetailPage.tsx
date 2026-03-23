import {
  ArrowLeft,
  Clock,
  Package,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { Variant_twoHours_twoDays } from "../backend.d";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/cartStore";

type ProductWithId = Product & { id: bigint };

const categoryColors: Record<string, string> = {
  Compressor: "from-blue-500 to-blue-700",
  Capacitor: "from-purple-500 to-purple-700",
  Thermostat: "from-green-500 to-green-700",
  Filter: "from-orange-500 to-orange-700",
  Fan: "from-cyan-500 to-cyan-700",
  Contactor: "from-red-500 to-red-700",
  Refrigerant: "from-indigo-500 to-indigo-700",
  default: "from-slate-500 to-slate-700",
};

const STAR_KEYS = ["star-1", "star-2", "star-3", "star-4", "star-5"];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actor } = useActor();
  const [product, setProduct] = useState<ProductWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!actor || !id) return;
    actor
      .getProduct(BigInt(id))
      .then((p) => {
        setProduct({ ...p, id: BigInt(id) });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-[#E5EAF0] h-96 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-[#6B7280]" />
        <p className="text-xl font-medium text-[#0F2A3A]">Product not found</p>
        <Button onClick={() => navigate("/shop")} className="mt-4">
          Back to Shop
        </Button>
      </div>
    );
  }

  const isRapid = product.deliveryType === Variant_twoHours_twoDays.twoHours;
  const gradient = categoryColors[product.category] || categoryColors.default;
  const price = Number(product.price) / 100;

  const handleAddToCart = () => {
    if (Number(product.stock) <= 0) return;
    addItem({
      productId: product.id.toString(),
      quantity: qty,
      name: product.name,
      price,
      imageUrl: product.imageUrl,
      deliveryType: product.deliveryType,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#6B7280] hover:text-[#0B5EA8] mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div
            className={`h-80 md:h-full min-h-[320px] bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-white/80 text-6xl font-bold">
                {product.category[0]}
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  isRapid
                    ? "bg-[#EAF8EF] text-[#22C55E]"
                    : "bg-[#EEF2F6] text-[#6B7280]"
                } flex items-center gap-1`}
              >
                {isRapid ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <Truck className="h-3 w-3" />
                )}
                {isRapid ? "Get in 2 Hours" : "Get in 2 Days"}
              </span>
              {Number(product.stock) > 0 ? (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-600">
                  In Stock ({product.stock.toString()})
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-500">
                  Out of Stock
                </span>
              )}
            </div>

            <p className="text-sm text-[#6B7280] mb-2">{product.category}</p>
            <h1 className="text-2xl font-bold text-[#0F2A3A] mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {STAR_KEYS.map((k) => (
                  <Star
                    key={k}
                    className="h-4 w-4 fill-[#F4B400] text-[#F4B400]"
                  />
                ))}
              </div>
              <span className="text-sm text-[#6B7280]">
                4.8/5 (124 reviews)
              </span>
            </div>

            <p className="text-3xl font-bold text-[#0B5EA8] mb-4">
              ${price.toFixed(2)}
            </p>
            <p className="text-[#2B2F33] text-sm leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium text-[#2B2F33]">
                Quantity:
              </span>
              <div className="flex items-center border border-[#E5EAF0] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQty((q) => Math.min(Number(product.stock), q + 1))
                  }
                  className="px-3 py-2 hover:bg-gray-100 transition font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={Number(product.stock) <= 0}
              className="w-full bg-[#0B5EA8] hover:bg-[#0951a0] text-white h-12 rounded-xl text-base"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
