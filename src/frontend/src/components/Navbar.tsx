import {
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCartStore } from "../store/cartStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function Navbar() {
  const cartCount = useCartStore((s) => s.getCount());
  const { identity, clear } = useInternetIdentity();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <div className="bg-[#0B5EA8] text-white text-sm text-center py-2 px-4">
        Free shipping on orders over $99 | Same-day delivery available in select
        areas
      </div>

      <header className="bg-white border-b border-[#E5EAF0] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-[#0B5EA8]"
            >
              <Snowflake className="h-6 w-6" />
              <span className="text-xl tracking-tight">FROST FLOW</span>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#2B2F33]">
              <Link to="/" className="hover:text-[#0B5EA8] transition-colors">
                Home
              </Link>
              <Link
                to="/shop"
                className="hover:text-[#0B5EA8] transition-colors"
              >
                Products
              </Link>
              <Link
                to="/shop?delivery=twoHours"
                className="hover:text-[#0B5EA8] transition-colors"
              >
                2-Hour Delivery
              </Link>
              <Link
                to="/shop?delivery=twoDays"
                className="hover:text-[#0B5EA8] transition-colors"
              >
                2-Day Delivery
              </Link>
              <Link
                to="/about"
                className="hover:text-[#0B5EA8] transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="hover:text-[#0B5EA8] transition-colors"
              >
                Contact
              </Link>
              {identity && (
                <Link
                  to="/admin"
                  data-ocid="nav.admin.link"
                  className="flex items-center gap-1 hover:text-[#0B5EA8] transition-colors text-[#0B5EA8] font-semibold"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Search className="h-5 w-5 text-[#2B2F33]" />
              </button>

              {identity ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/orders">
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                      <User className="h-5 w-5 text-[#2B2F33]" />
                    </button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clear}
                    className="text-xs"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <button
                    type="button"
                    className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <User className="h-5 w-5 text-[#2B2F33]" />
                  </button>
                </Link>
              )}

              <Link
                to="/cart"
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ShoppingCart className="h-5 w-5 text-[#2B2F33]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0B5EA8] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="pb-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search refrigerant parts..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  className="bg-[#0B5EA8] hover:bg-[#0951a0]"
                >
                  Search
                </Button>
              </form>
            </div>
          )}
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#E5EAF0] bg-white px-4 py-3 flex flex-col gap-3 text-sm font-medium">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="hover:text-[#0B5EA8]"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setMenuOpen(false)}
              className="hover:text-[#0B5EA8]"
            >
              Products
            </Link>
            <Link
              to="/shop?delivery=twoHours"
              onClick={() => setMenuOpen(false)}
              className="hover:text-[#0B5EA8]"
            >
              2-Hour Delivery
            </Link>
            <Link
              to="/shop?delivery=twoDays"
              onClick={() => setMenuOpen(false)}
              className="hover:text-[#0B5EA8]"
            >
              2-Day Delivery
            </Link>
            <Link
              to="/about"
              onClick={() => setMenuOpen(false)}
              className="hover:text-[#0B5EA8]"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-[#0B5EA8]"
            >
              Contact
            </Link>
            {identity ? (
              <>
                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-[#0B5EA8]"
                >
                  My Orders
                </Link>
                <Link
                  to="/admin"
                  data-ocid="nav.admin.link"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-1 text-[#0B5EA8] font-semibold hover:text-[#0951a0]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin Panel
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setMenuOpen(false);
                  }}
                  className="text-left text-red-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="hover:text-[#0B5EA8]"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
