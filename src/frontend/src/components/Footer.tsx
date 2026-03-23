import { Snowflake } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0F2A3A] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Snowflake className="h-5 w-5" />
              FROST FLOW
            </div>
            <p className="text-sm leading-relaxed">
              Premium refrigerant spare parts delivered fast. Your trusted
              partner for HVAC and refrigeration solutions.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="hover:text-white transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?delivery=twoHours"
                  className="hover:text-white transition"
                >
                  2-Hour Delivery
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?delivery=twoDays"
                  className="hover:text-white transition"
                >
                  2-Day Delivery
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>support@frostflow.com</li>
              <li>+1 (800) 555-FROST</li>
              <li>Mon-Fri, 8am-6pm</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-gray-500">
          © 2026 Frost Flow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
