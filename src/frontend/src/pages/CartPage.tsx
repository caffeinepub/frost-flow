import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useCartStore } from "../store/cartStore";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-[#6B7280] opacity-50" />
        <h2 className="text-xl font-bold text-[#0F2A3A] mb-2">
          Your cart is empty
        </h2>
        <p className="text-[#6B7280] mb-6">Add some products to get started</p>
        <Link to="/shop">
          <Button className="bg-[#0B5EA8] hover:bg-[#0951a0]">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-[#0F2A3A] mb-8">
        Shopping Cart ({items.length} items)
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-2xl border border-[#E5EAF0] p-4 flex gap-4"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {item.name[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#0F2A3A] mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-[#6B7280] mb-2">
                  {item.deliveryType === "twoHours"
                    ? "⚡ 2-Hour Delivery"
                    : "🚚 2-Day Delivery"}
                </p>
                <p className="font-bold text-[#0B5EA8]">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-red-400 hover:text-red-600 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border border-[#E5EAF0] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="px-2 py-1 hover:bg-gray-100 transition"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="px-2 py-1 hover:bg-gray-100 transition"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 h-fit sticky top-24">
          <h3 className="font-bold text-[#0F2A3A] mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between text-sm"
              >
                <span className="text-[#6B7280]">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E5EAF0] pt-3 mb-6">
            <div className="flex justify-between font-bold text-[#0F2A3A]">
              <span>Total</span>
              <span className="text-[#0B5EA8]">${getTotal().toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={() => navigate("/checkout")}
            className="w-full bg-[#0B5EA8] hover:bg-[#0951a0] h-12 rounded-xl text-base"
          >
            Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
