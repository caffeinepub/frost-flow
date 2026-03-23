import { ChevronRight, Clock, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../backend.d";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type OrderWithId = Order & { id: bigint };

const statusColors: Record<string, string> = {
  processing: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  outForDelivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  processing: "Processing",
  confirmed: "Confirmed",
  shipped: "Shipped",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
};

export default function OrdersPage() {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !identity) {
      setLoading(false);
      return;
    }
    actor
      .getOrders()
      .then((os) => {
        const withIds = os.map((o, i) => ({ ...o, id: BigInt(i) }));
        setOrders([...withIds].reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, identity]);

  if (!identity) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-[#6B7280]" />
        <h2 className="text-xl font-bold text-[#0F2A3A] mb-2">
          Sign in to view orders
        </h2>
        <Button
          onClick={login}
          className="bg-[#0B5EA8] hover:bg-[#0951a0] mt-4"
        >
          Login
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((key) => (
          <div
            key={key}
            className="bg-white rounded-2xl border border-[#E5EAF0] h-24 animate-pulse mb-4"
          />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-[#6B7280] opacity-50" />
        <h2 className="text-xl font-bold text-[#0F2A3A] mb-2">No orders yet</h2>
        <p className="text-[#6B7280] mb-6">
          Your orders will appear here once placed
        </p>
        <Link to="/shop">
          <Button className="bg-[#0B5EA8] hover:bg-[#0951a0]">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-[#0F2A3A] mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const ds = order.deliveryStatus as string;
          return (
            <Link to={`/orders/${order.id}`} key={order.id.toString()}>
              <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 hover:shadow-md transition flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-[#0F2A3A]">
                      Order #{order.id.toString()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[ds] || "bg-gray-100 text-gray-600"}`}
                    >
                      {statusLabels[ds] || ds}
                    </span>
                  </div>
                  <div className="text-sm text-[#6B7280] flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(
                      Number(order.createdAt) / 1_000_000,
                    ).toLocaleDateString()}
                    <span>·</span>
                    <span>{order.items.length} item(s)</span>
                    <span>·</span>
                    <span className="font-semibold text-[#0B5EA8]">
                      ${(Number(order.totalAmount) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[#6B7280]" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
