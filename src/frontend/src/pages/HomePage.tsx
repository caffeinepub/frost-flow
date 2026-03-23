import {
  ArrowRight,
  Clock,
  Shield,
  Snowflake,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../backend.d";
import ProductCard from "../components/ProductCard";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";

type ProductWithId = Product & { id: bigint };

const SNOWFLAKES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 5.3 + 3) % 100}%`,
  top: `${(i * 7.1 + 5) % 100}%`,
  size: `${16 + (i % 4) * 6}px`,
  opacity: 0.3 + (i % 5) * 0.14,
}));

export default function HomePage() {
  const { actor } = useActor();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor
      .getProducts()
      .then((ps) => {
        const withIds = ps
          .filter((p) => p.isActive)
          .map((p, i) => ({ ...p, id: BigInt(i) }));
        setProducts(withIds);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  const featured = products.slice(0, 8);
  const rapidProducts = products
    .filter((p) => (p.deliveryType as string) === "twoHours")
    .slice(0, 4);

  return (
    <div>
      <section className="relative bg-gradient-to-br from-[#0F2A3A] via-[#0B5EA8] to-[#1a7fd4] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {SNOWFLAKES.map((flake) => (
            <Snowflake
              key={flake.id}
              className="absolute text-white"
              style={{
                left: flake.left,
                top: flake.top,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
              }}
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
              <Clock className="h-4 w-4" />
              Same-day delivery available
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Premium Refrigerant
              <br />
              <span className="text-[#7DD3FC]">Spare Parts</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              Professional-grade components for HVAC and refrigeration systems.
              Fast delivery, guaranteed quality.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop">
                <Button className="bg-white text-[#0B5EA8] hover:bg-blue-50 font-semibold px-8 py-6 rounded-xl text-base">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/shop?delivery=twoHours">
                <Button
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 px-8 py-6 rounded-xl text-base"
                >
                  <Clock className="mr-2 h-4 w-4" /> 2-Hour Delivery
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-[#E5EAF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+", label: "Products" },
              { value: "10K+", label: "Happy Customers" },
              { value: "2hrs", label: "Fastest Delivery" },
              { value: "99%", label: "Satisfaction Rate" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-[#0B5EA8]">
                  {stat.value}
                </div>
                <div className="text-sm text-[#6B7280]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F2A3A]">
            Explore Our Categories
          </h2>
          <p className="text-[#6B7280] mt-1">Find parts by delivery speed</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/shop?delivery=twoHours">
            <div className="group bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-8 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500 text-white rounded-xl p-3">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F2A3A]">
                    Delivery in 2 Hours
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    Urgent parts, delivered fast
                  </p>
                </div>
              </div>
              <p className="text-[#2B2F33] text-sm mb-4">
                Critical components available for same-day urgent delivery.
                Compressors, capacitors, contactors and more.
              </p>
              <span className="text-green-600 font-semibold text-sm group-hover:underline">
                Browse 2-Hour Parts →
              </span>
            </div>
          </Link>
          <Link to="/shop?delivery=twoDays">
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-8 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#0B5EA8] text-white rounded-xl p-3">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F2A3A]">
                    Delivery in 2 Days
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    Standard shipping, great prices
                  </p>
                </div>
              </div>
              <p className="text-[#2B2F33] text-sm mb-4">
                Full range of refrigerant parts with standard 2-day shipping.
                Filters, refrigerant gases, fans, and more.
              </p>
              <span className="text-[#0B5EA8] font-semibold text-sm group-hover:underline">
                Browse 2-Day Parts →
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F2A3A]">
              Featured Products
            </h2>
            <p className="text-[#6B7280] mt-1">
              Top-rated refrigerant spare parts
            </p>
          </div>
          <Link to="/shop">
            <Button
              variant="outline"
              className="border-[#0B5EA8] text-[#0B5EA8] hover:bg-blue-50 rounded-xl"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
              <div
                key={key}
                className="bg-white rounded-2xl border border-[#E5EAF0] h-72 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id.toString()} product={p} />
            ))}
          </div>
        )}
      </section>

      {rapidProducts.length > 0 && (
        <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#22C55E] text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⚡ FAST
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#0F2A3A]">
                  Get in 2 Hours
                </h2>
              </div>
              <Link to="/shop?delivery=twoHours">
                <Button
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50 rounded-xl"
                >
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {rapidProducts.map((p) => (
                <ProductCard key={p.id.toString()} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Shield className="h-8 w-8" />,
              title: "Genuine Parts",
              desc: "100% authentic refrigerant components from trusted manufacturers",
            },
            {
              icon: <Clock className="h-8 w-8" />,
              title: "Fast Delivery",
              desc: "2-hour delivery available for urgent requirements",
            },
            {
              icon: <Star className="h-8 w-8" />,
              title: "Expert Support",
              desc: "Technical assistance from our HVAC specialists",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl p-6 border border-[#E5EAF0] text-center"
            >
              <div className="text-[#0B5EA8] flex justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-[#0F2A3A] mb-2">{item.title}</h3>
              <p className="text-sm text-[#6B7280]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
