import {
  BarChart3,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { ContactMessage, Order, Product } from "../backend.d";
import {
  type Variant_shipped_outForDelivery_delivered_confirmed_processing,
  Variant_twoHours_twoDays,
} from "../backend.d";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type ProductWithId = Product & { id: bigint };
type OrderWithId = Order & { id: bigint };

const emptyProduct: Product = {
  name: "",
  description: "",
  deliveryType: Variant_twoHours_twoDays.twoHours,
  isActive: true,
  stock: BigInt(0),
  imageUrl: "",
  category: "",
  price: BigInt(0),
};

export default function AdminPage() {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [editProduct, setEditProduct] = useState<
    (ProductWithId & { isNew?: boolean }) | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Product>(emptyProduct);
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [secretCode, setSecretCode] = useState("");

  const checkAdminStatus = useCallback(async () => {
    if (!actor || !identity) return;
    try {
      const adminStatus = await (actor as any).checkAdminAccess();
      setIsAdmin(adminStatus);
    } catch {
      setIsAdmin(false);
    }
  }, [actor, identity]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const claimAdmin = async () => {
    if (!actor) return;
    setClaimingAdmin(true);
    try {
      const result = await (actor as any).claimAdminWithCode(secretCode);
      if (result) {
        toast.success("Admin access granted!");
        setIsAdmin(true);
      } else {
        toast.error("Invalid code or an admin already exists.");
      }
    } catch (_e) {
      toast.error("Failed to claim admin access");
    } finally {
      setClaimingAdmin(false);
    }
  };

  const loadData = useCallback(() => {
    if (!actor) return;
    const anyActor = actor as any;
    anyActor
      .getProductsWithIds()
      .then((ps: [bigint, Product][]) =>
        setProducts(ps.map(([id, p]) => ({ ...p, id }))),
      )
      .catch(() => {
        actor
          .getProducts()
          .then((ps) =>
            setProducts(ps.map((p, i) => ({ ...p, id: BigInt(i + 1) }))),
          );
      });
    anyActor
      .getOrdersWithIds()
      .then((os: [bigint, Order][]) =>
        setOrders(os.map(([id, o]) => ({ ...o, id }))),
      )
      .catch(() => {
        actor
          .getOrders()
          .then((os) =>
            setOrders(os.map((o, i) => ({ ...o, id: BigInt(i + 1) }))),
          );
      });
    actor
      .getContactMessages()
      .then(setMessages)
      .catch(() => {});
  }, [actor]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  if (!identity) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-[#0B5EA8]" />
        <h2 className="text-xl font-bold text-[#0F2A3A] mb-2">
          Admin Access Required
        </h2>
        <p className="text-[#6B7280] mb-4">
          Please log in with Internet Identity to access the admin panel.
        </p>
        <Button
          onClick={login}
          className="bg-[#0B5EA8] hover:bg-[#0951a0] mt-4"
        >
          Login with Internet Identity
        </Button>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B5EA8]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-[#0B5EA8]" />
        <h2 className="text-xl font-bold text-[#0F2A3A] mb-2">Admin Panel</h2>
        <p className="text-[#6B7280] mb-6">
          Enter the admin secret code to gain access.
        </p>
        <Input
          type="password"
          placeholder="Enter admin code"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value)}
          className="mb-3"
          data-ocid="admin.input"
        />
        <Button
          onClick={claimAdmin}
          disabled={claimingAdmin || secretCode === ""}
          className="bg-[#0B5EA8] hover:bg-[#0951a0] w-full mb-3"
          data-ocid="admin.primary_button"
        >
          {claimingAdmin ? "Verifying..." : "Unlock Admin Access"}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="w-full"
          data-ocid="admin.secondary_button"
        >
          Go Home
        </Button>
      </div>
    );
  }

  const openNewProduct = () => {
    setForm(emptyProduct);
    setEditProduct({ ...emptyProduct, id: BigInt(-1), isNew: true });
  };

  const openEditProduct = (p: ProductWithId) => {
    setForm({ ...p });
    setEditProduct({ ...p });
  };

  const saveProduct = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      const product: Product = {
        ...form,
        price: BigInt(Math.round(Number(form.price))),
        stock: BigInt(Number(form.stock)),
      };
      if (editProduct?.isNew) {
        await actor.createProduct(product);
        toast.success("Product created");
      } else if (editProduct) {
        await actor.updateProduct(editProduct.id, product);
        toast.success("Product updated");
      }
      setEditProduct(null);
      loadData();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: bigint) => {
    if (!actor || !confirm("Delete this product?")) return;
    try {
      await actor.deleteProduct(id);
      toast.success("Product deleted");
      loadData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const updateDeliveryStatus = async (orderId: bigint, status: string) => {
    if (!actor) return;
    try {
      await actor.updateDeliveryStatus(
        orderId,
        status as Variant_shipped_outForDelivery_delivered_confirmed_processing,
      );
      toast.success("Status updated");
      loadData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2A3A]">Admin Panel</h1>
          <p className="text-sm text-[#6B7280]">
            Manage products, orders and messages
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Products",
            value: products.length,
            icon: <Package className="h-5 w-5" />,
          },
          {
            label: "Orders",
            value: orders.length,
            icon: <BarChart3 className="h-5 w-5" />,
          },
          {
            label: "Messages",
            value: messages.length,
            icon: <MessageSquare className="h-5 w-5" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-[#E5EAF0] p-4 flex items-center gap-3"
          >
            <div className="text-[#0B5EA8]">{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-[#0F2A3A]">{s.value}</div>
              <div className="text-sm text-[#6B7280]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-[#0F2A3A]">
              Products ({products.length})
            </h2>
            <Button
              onClick={openNewProduct}
              className="bg-[#0B5EA8] hover:bg-[#0951a0] rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>

          {editProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-[#0F2A3A] mb-4">
                {editProduct.isNew ? "New Product" : "Edit Product"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label
                    htmlFor="prod-name"
                    className="text-sm font-medium block mb-1"
                  >
                    Name
                  </label>
                  <Input
                    id="prod-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label
                    htmlFor="prod-cat"
                    className="text-sm font-medium block mb-1"
                  >
                    Category
                  </label>
                  <Input
                    id="prod-cat"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="prod-desc"
                    className="text-sm font-medium block mb-1"
                  >
                    Description
                  </label>
                  <Input
                    id="prod-desc"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-price"
                    className="text-sm font-medium block mb-1"
                  >
                    Price (in cents)
                  </label>
                  <Input
                    id="prod-price"
                    type="number"
                    value={Number(form.price)}
                    onChange={(e) =>
                      setForm({ ...form, price: BigInt(e.target.value || 0) })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-stock"
                    className="text-sm font-medium block mb-1"
                  >
                    Stock
                  </label>
                  <Input
                    id="prod-stock"
                    type="number"
                    value={Number(form.stock)}
                    onChange={(e) =>
                      setForm({ ...form, stock: BigInt(e.target.value || 0) })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-delivery"
                    className="text-sm font-medium block mb-1"
                  >
                    Delivery Type
                  </label>
                  <select
                    id="prod-delivery"
                    value={form.deliveryType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        deliveryType: e.target
                          .value as Variant_twoHours_twoDays,
                      })
                    }
                    className="w-full border border-[#E5EAF0] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={Variant_twoHours_twoDays.twoHours}>
                      2 Hours
                    </option>
                    <option value={Variant_twoHours_twoDays.twoDays}>
                      2 Days
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="prod-img"
                    className="text-sm font-medium block mb-1"
                  >
                    Image URL
                  </label>
                  <Input
                    id="prod-img"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm({ ...form, imageUrl: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={saveProduct}
                  disabled={saving}
                  className="bg-[#0B5EA8] hover:bg-[#0951a0]"
                >
                  {saving ? "Saving..." : "Save Product"}
                </Button>
                <Button variant="outline" onClick={() => setEditProduct(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
            {products.length === 0 ? (
              <div className="p-8 text-center text-[#6B7280]">
                No products yet. Click "Add Product" to get started.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-[#E5EAF0]">
                  <tr>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Name
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Category
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Price
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Stock
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Delivery
                    </th>
                    <th className="text-right p-4 font-medium text-[#6B7280]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id.toString()}
                      className="border-b border-[#E5EAF0] hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium text-[#0F2A3A]">
                        {p.name}
                      </td>
                      <td className="p-4 text-[#6B7280]">{p.category}</td>
                      <td className="p-4 text-[#0B5EA8] font-medium">
                        ${(Number(p.price) / 100).toFixed(2)}
                      </td>
                      <td className="p-4">{p.stock.toString()}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            p.deliveryType === Variant_twoHours_twoDays.twoHours
                              ? "bg-[#EAF8EF] text-[#22C55E]"
                              : "bg-[#EEF2F6] text-[#6B7280]"
                          }`}
                        >
                          {p.deliveryType === Variant_twoHours_twoDays.twoHours
                            ? "2 Hours"
                            : "2 Days"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProduct(p)}
                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <h2 className="font-bold text-[#0F2A3A] mb-4">
            Orders ({orders.length})
          </h2>
          <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-[#6B7280]">
                No orders yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-[#E5EAF0]">
                  <tr>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Order ID
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Total
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Payment
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Delivery Status
                    </th>
                    <th className="text-left p-4 font-medium text-[#6B7280]">
                      Update Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id.toString()}
                      className="border-b border-[#E5EAF0] hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium text-[#0F2A3A]">
                        #{order.id.toString()}
                      </td>
                      <td className="p-4 text-[#0B5EA8] font-medium">
                        ${(Number(order.totalAmount) / 100).toFixed(2)}
                      </td>
                      <td className="p-4">{order.paymentMethod as string}</td>
                      <td className="p-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {order.deliveryStatus as string}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.deliveryStatus as string}
                          onChange={(e) =>
                            updateDeliveryStatus(order.id, e.target.value)
                          }
                          className="border border-[#E5EAF0] rounded-lg px-2 py-1 text-xs"
                        >
                          {[
                            "processing",
                            "confirmed",
                            "shipped",
                            "outForDelivery",
                            "delivered",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <h2 className="font-bold text-[#0F2A3A] mb-4">
            Contact Messages ({messages.length})
          </h2>
          {messages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center text-[#6B7280]">
              No messages yet.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={`${msg.email}-${msg.createdAt.toString()}`}
                  className="bg-white rounded-2xl border border-[#E5EAF0] p-5"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-[#0F2A3A]">
                      {msg.name}
                    </span>
                    <span className="text-xs text-[#6B7280]">{msg.email}</span>
                  </div>
                  <p className="text-sm text-[#2B2F33]">{msg.message}</p>
                  <p className="text-xs text-[#6B7280] mt-2">
                    {new Date(
                      Number(msg.createdAt) / 1_000_000,
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
