import { Clock, ShoppingCart, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { Variant_twoHours_twoDays } from "../backend.d";
import { useCartStore } from "../store/cartStore";
import { Button } from "./ui/button";

interface Props {
  product: Product & { id: bigint };
}

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

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const isRapid = product.deliveryType === Variant_twoHours_twoDays.twoHours;
  const gradient = categoryColors[product.category] || categoryColors.default;
  const price = Number(product.price) / 100;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (Number(product.stock) <= 0) return;
    addItem({
      productId: product.id.toString(),
      quantity: 1,
      name: product.name,
      price,
      imageUrl: product.imageUrl,
      deliveryType: product.deliveryType,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-[#E5EAF0] overflow-hidden">
        {/* Image / placeholder */}
        <div
          className={`h-48 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-white/80 text-4xl font-bold">
              {product.category[0]}
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
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
              {isRapid ? "2 Hours" : "2 Days"}
            </span>
            {Number(product.stock) > 0 ? (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/90 text-green-600">
                In Stock
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/90 text-red-500">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-[#6B7280] mb-1">{product.category}</p>
          <h3 className="font-semibold text-[#0F2A3A] text-sm line-clamp-2 mb-2 group-hover:text-[#0B5EA8] transition">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-[#0B5EA8]">
              ${price.toFixed(2)}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#6B7280]">
              <Star className="h-3 w-3 fill-[#F4B400] text-[#F4B400]" />
              4.8
            </span>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={Number(product.stock) <= 0}
            className="w-full bg-[#0B5EA8] hover:bg-[#0951a0] text-white text-sm rounded-xl h-9"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Link>
  );
}
