import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SUPPORT_EMAIL = "abimelekgirma@gmail.com";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "contact us";
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute(
      "content",
      "Contact QR Forge — questions, feedback, partnerships or bug reports. We respond within 24–48 hours.",
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`QR Forge — message from ${name || "a visitor"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success("Opening your email client…");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-3xl py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to QR Forge
        </Link>

        <article className="surface-card p-8 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Have a question, suggestion, or feedback? We'd love to hear from you. Use the form
            below or email us directly — we'll do our best to respond within 24–48 hours.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <InfoTile icon={<Mail className="h-5 w-5 text-primary" />} title="Email">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="break-all text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </InfoTile>
            <InfoTile icon={<Clock className="h-5 w-5 text-primary" />} title="Response time">
              Within 24–48 hours, Mon–Fri.
            </InfoTile>
            <InfoTile icon={<MessageSquare className="h-5 w-5 text-primary" />} title="Support">
              Use the form below or email us anytime — we read every message.
            </InfoTile>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Send us a message</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Your email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
              />
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4" /> Send message
            </Button>
            <p className="text-xs text-muted-foreground">
              This form opens your email client with the message pre-filled. You can also email
              us directly at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </form>

          <p className="mt-10 border-t pt-6 text-xs text-muted-foreground">
            QR Forge is independently managed. For privacy and data questions, see our{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function InfoTile({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-secondary/40 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{children}</div>
    </div>
  );
}
