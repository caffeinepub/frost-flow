import { ArrowLeft, CheckCircle, Circle, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Order } from "../backend.d";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";

const STEPS = [
  { key: "processing", label: "Processing" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "outForDelivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actor } = useActor();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !id) return;
    actor
      .getOrder(BigInt(id))
      .then((o) => {
        setOrder(o);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-[#E5EAF0] h-80 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-[#6B7280]" />
        <p className="text-xl font-medium text-[#0F2A3A]">Order not found</p>
        <Button onClick={() => navigate("/orders")} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex(
    (s) => s.key === (order.deliveryStatus as string),
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <button
        type="button"
        onClick={() => navigate("/orders")}
        className="flex items-center gap-2 text-[#6B7280] hover:text-[#0B5EA8] mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0F2A3A]">Order #{id}</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Placed on{" "}
              {new Date(
                Number(order.createdAt) / 1_000_000,
              ).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#0B5EA8]">
              ${(Number(order.totalAmount) / 100).toFixed(2)}
            </p>
            <p className="text-xs text-[#6B7280]">
              {order.paymentMethod === "stripe"
                ? "Paid Online"
                : "Cash on Delivery"}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-[#0F2A3A] mb-4">Delivery Status</h3>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-[#E5EAF0] z-0" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-[#0B5EA8] transition-all z-0"
              style={{
                width:
                  currentStepIdx <= 0
                    ? "0%"
                    : `${(currentStepIdx / (STEPS.length - 1)) * 100}%`,
              }}
            />
            <div className="flex justify-between relative z-10">
              {STEPS.map((step, idx) => {
                const isComplete = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition ${
                        isComplete
                          ? "bg-[#0B5EA8] border-[#0B5EA8]"
                          : isCurrent
                            ? "bg-white border-[#0B5EA8]"
                            : "bg-white border-[#E5EAF0]"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : isCurrent ? (
                        <div className="h-3 w-3 rounded-full bg-[#0B5EA8]" />
                      ) : (
                        <Circle className="h-5 w-5 text-[#E5EAF0]" />
                      )}
                    </div>
                    <span
                      className={`text-xs text-center font-medium ${
                        isCurrent
                          ? "text-[#0B5EA8]"
                          : isComplete
                            ? "text-[#0F2A3A]"
                            : "text-[#6B7280]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-[#0F2A3A] mb-3">Items</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.productId.toString()}
                className="flex justify-between py-2 border-b border-[#E5EAF0] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-[#0F2A3A]">
                    Product #{item.productId.toString()}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Qty: {item.quantity.toString()}
                  </p>
                </div>
                <span className="font-medium text-[#0B5EA8]">
                  ${(Number(item.priceAtPurchase) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
