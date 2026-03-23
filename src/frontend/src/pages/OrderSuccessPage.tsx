import { CheckCircle, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Variant_cod_stripe } from "../backend.d";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/cartStore";

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const { actor } = useActor();
  const clearCart = useCartStore((s) => s.clearCart);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sessionId = searchParams.get("session_id");
  const directOrderId = searchParams.get("order_id");

  useEffect(() => {
    if (directOrderId) {
      setOrderId(directOrderId);
      setDone(true);
      return;
    }

    if (!sessionId || !actor || done) return;
    setLoading(true);

    actor
      .getStripeSessionStatus(sessionId)
      .then(async (status) => {
        if (status.__kind__ === "completed") {
          try {
            const id = await actor.placeOrder(
              Variant_cod_stripe.stripe,
              sessionId,
            );
            clearCart();
            setOrderId(id.toString());
          } catch (e) {
            console.error(e);
          }
        }
        setDone(true);
        setLoading(false);
      })
      .catch(() => {
        setDone(true);
        setLoading(false);
      });
  }, [sessionId, actor, done, directOrderId, clearCart]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5EA8] mx-auto mb-4" />
        <p className="text-[#6B7280]">Confirming your payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-10 shadow-sm">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-[#0F2A3A] mb-2">
          Order Placed!
        </h1>
        <p className="text-[#6B7280] mb-2">
          Thank you for your order. We'll get it to you fast.
        </p>
        {orderId && (
          <p className="text-sm font-medium text-[#0B5EA8] mb-6">
            Order #{orderId}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link to="/orders">
            <Button className="w-full bg-[#0B5EA8] hover:bg-[#0951a0] rounded-xl">
              <Package className="h-4 w-4 mr-2" /> Track My Order
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" className="w-full rounded-xl">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
