import { Clock, Shield, Snowflake, Star, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <div className="bg-[#0B5EA8] text-white rounded-full p-4">
            <Snowflake className="h-10 w-10" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-[#0F2A3A] mb-4">
          About Frost Flow
        </h1>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
          Your trusted partner for premium refrigerant spare parts. We deliver
          quality components fast, so your HVAC and refrigeration systems never
          stay down for long.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {[
          {
            icon: <Shield className="h-6 w-6" />,
            title: "Genuine Quality",
            desc: "Every part we sell is 100% authentic, sourced directly from trusted manufacturers and suppliers.",
          },
          {
            icon: <Clock className="h-6 w-6" />,
            title: "Lightning Fast",
            desc: "With our 2-hour delivery option, critical components reach you before your system loses too much downtime.",
          },
          {
            icon: <Star className="h-6 w-6" />,
            title: "Expert Team",
            desc: "Our team of HVAC specialists is always ready to help you find the right part for your application.",
          },
          {
            icon: <Users className="h-6 w-6" />,
            title: "Customer First",
            desc: "Over 10,000 satisfied customers trust Frost Flow for their refrigerant parts needs.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl border border-[#E5EAF0] p-6"
          >
            <div className="text-[#0B5EA8] mb-3">{item.icon}</div>
            <h3 className="font-bold text-[#0F2A3A] mb-2">{item.title}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="bg-gradient-to-br from-[#0F2A3A] to-[#0B5EA8] text-white rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <p className="text-blue-100 leading-relaxed mb-4">
          Frost Flow was founded by HVAC professionals who were frustrated with
          slow, unreliable parts suppliers. We built a platform that combines an
          extensive inventory with fast logistics to serve technicians and
          businesses who can't afford to wait.
        </p>
        <p className="text-blue-100 leading-relaxed">
          Today, we offer over 500 refrigerant parts across all major brands and
          ship to technicians, businesses, and homeowners nationwide.
        </p>
      </div>
    </div>
  );
}
