import { Clock, Mail, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";

export default function ContactPage() {
  const { actor } = useActor();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    try {
      await actor.submitMessage(form.name, form.email, form.message);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      toast.success("Message sent! We'll get back to you soon.");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#0F2A3A] mb-4">Contact Us</h1>
        <p className="text-[#6B7280]">Have a question? We're here to help.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {[
            {
              icon: <Mail className="h-5 w-5" />,
              title: "Email",
              value: "support@frostflow.com",
            },
            {
              icon: <Phone className="h-5 w-5" />,
              title: "Phone",
              value: "+1 (800) 555-FROST",
            },
            {
              icon: <Clock className="h-5 w-5" />,
              title: "Hours",
              value: "Mon-Fri, 8am-6pm EST",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border border-[#E5EAF0] p-5 flex items-center gap-4"
            >
              <div className="bg-blue-50 text-[#0B5EA8] rounded-xl p-3">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F2A3A]">
                  {item.title}
                </p>
                <p className="text-sm text-[#6B7280]">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6">
          {sent ? (
            <div className="text-center py-8">
              <Send className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-[#0F2A3A] mb-2">Message Sent!</h3>
              <p className="text-sm text-[#6B7280]">
                We'll respond within 24 hours.
              </p>
              <Button
                onClick={() => setSent(false)}
                variant="outline"
                className="mt-4"
              >
                Send Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="contact-name"
                  className="text-sm font-medium text-[#0F2A3A] mb-1 block"
                >
                  Name
                </label>
                <Input
                  id="contact-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="text-sm font-medium text-[#0F2A3A] mb-1 block"
                >
                  Email
                </label>
                <Input
                  id="contact-email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="text-sm font-medium text-[#0F2A3A] mb-1 block"
                >
                  Message
                </label>
                <Textarea
                  id="contact-message"
                  required
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="How can we help?"
                  rows={5}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B5EA8] hover:bg-[#0951a0] h-11 rounded-xl"
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
