import { CreditCard, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Variant_cod_stripe } from "../backend.d";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCartStore } from "../store/cartStore";

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [loading, setLoading] = useState(false);

  if (!identity) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-[#0B5EA8]" />
        <h2 className="text-xl font-bold text-[#0F2A3A] mb-2">
          Sign in to Checkout
        </h2>
        <p className="text-[#6B7280] mb-6">
          Please log in with Internet Identity to continue
        </p>
        <Button onClick={login} className="bg-[#0B5EA8] hover:bg-[#0951a0]">
          Login with Internet Identity
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      if (paymentMethod === "stripe") {
        const stripeItems = items.map((item) => ({
          productName: item.name,
          currency: "usd",
          quantity: BigInt(item.quantity),
          priceInCents: BigInt(Math.round(item.price * 100)),
          productDescription: item.name,
        }));
        const origin = window.location.origin;
        const sessionUrl = await actor.createCheckoutSession(
          stripeItems,
          `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
          `${origin}/checkout`,
        );
        window.location.href = sessionUrl;
      } else {
        const orderId = await actor.placeOrder(Variant_cod_stripe.cod, null);
        clearCart();
        navigate(`/order-success?order_id=${orderId.toString()}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-[#0F2A3A] mb-8">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Payment method */}
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6">
            <h3 className="font-bold text-[#0F2A3A] mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  paymentMethod === "cod"
                    ? "border-[#0B5EA8] bg-blue-50"
                    : "border-[#E5EAF0] hover:border-blue-200"
                }`}
              >
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="text-[#0B5EA8]"
                />
                <Truck className="h-5 w-5 text-[#0B5EA8]" />
                <div>
                  <p className="font-medium text-[#0F2A3A]">Cash on Delivery</p>
                  <p className="text-xs text-[#6B7280]">
                    Pay when your order arrives
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  paymentMethod === "stripe"
                    ? "border-[#0B5EA8] bg-blue-50"
                    : "border-[#E5EAF0] hover:border-blue-200"
                }`}
              >
                <input
                  type="radio"
                  value="stripe"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                  className="text-[#0B5EA8]"
                />
                <CreditCard className="h-5 w-5 text-[#0B5EA8]" />
                <div>
                  <p className="font-medium text-[#0F2A3A]">
                    Pay Online (Stripe)
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Secure payment via Stripe — Visa, Mastercard, etc.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Items review */}
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6">
            <h3 className="font-bold text-[#0F2A3A] mb-4">Order Items</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center py-2 border-b border-[#E5EAF0] last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm text-[#0F2A3A]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      Qty: {item.quantity} ·{" "}
                      {item.deliveryType === "twoHours"
                        ? "2-Hour Delivery"
                        : "2-Day Delivery"}
                    </p>
                  </div>
                  <span className="font-bold text-[#0B5EA8]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 h-fit sticky top-24">
          <h3 className="font-bold text-[#0F2A3A] mb-4">Order Total</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Subtotal</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Delivery</span>
              <span className="text-green-600">Free</span>
            </div>
          </div>
          <div className="border-t border-[#E5EAF0] pt-3 mb-6">
            <div className="flex justify-between font-bold text-[#0F2A3A] text-lg">
              <span>Total</span>
              <span className="text-[#0B5EA8]">${getTotal().toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full bg-[#0B5EA8] hover:bg-[#0951a0] h-12 rounded-xl text-base"
          >
            {loading
              ? "Processing..."
              : paymentMethod === "stripe"
                ? "Pay with Stripe"
                : "Place Order"}
          </Button>
          <p className="text-xs text-center text-[#6B7280] mt-3 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Secure checkout
          </p>
        </div>
      </div>
    </div>
  );
}
