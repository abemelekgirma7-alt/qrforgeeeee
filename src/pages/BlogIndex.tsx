import { Link } from "react-router-dom";
import { ArrowRight, Clock, QrCode } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { Button } from "@/components/ui/button";
import johnSmithAuthor from "@/assets/blog/john-smith-author.jpg";

const CATEGORY_FOR_SLUG: Record<string, string> = {
  "wifi-qr-code-guide": "GUIDE",
  "vcard-qr-business-card": "BUSINESS",
  "qr-codes-for-restaurants": "USE CASES",
  "event-qr-codes-tickets-rsvps": "USE CASES",
  "qr-code-security-quishing": "SECURITY",
  "branded-qr-code-with-logo": "MARKETING",
};

export default function BlogIndex() {
  useEffect(() => { document.title = "QR Forge Blog — Guides, comparisons & best practices"; }, []);

  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="min-h-screen bg-background">
      <Navbar blogLinkLabel="Generator" />

      {/* Featured hero */}
      <section className="container mt-8 sm:mt-12">
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
          <Link to={`/blog/${featured.slug}`} className="group relative overflow-hidden rounded-2xl">
            <span className="absolute left-4 top-4 z-10 rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Featured
            </span>
            <img
              src={featured.cover}
              alt={featured.title}
              width={1280}
              height={720}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {CATEGORY_FOR_SLUG[featured.slug] || "GUIDE"}
            </span>
            <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {featured.title}
            </h1>
            <p className="mt-4 text-muted-foreground sm:text-lg">{featured.description}</p>
            <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
              <img
                src={johnSmithAuthor}
                alt="John Smith"
                loading="lazy"
                width={1024}
                height={1024}
                className="h-9 w-9 rounded-full border object-cover"
              />
              <span>By <span className="font-medium text-foreground">John Smith</span></span>
              <span>·</span>
              <span>{featured.date}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readingTime}</span>
            </div>
            <Link to={`/blog/${featured.slug}`}>
              <Button className="mt-6 rounded-md">
                Read Article <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest + Sidebar */}
      <section className="container mt-16 grid gap-10 lg:grid-cols-[1fr,320px]">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight">Latest QR Code Guides</h2>
            <span className="text-sm font-medium text-primary">All articles →</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/#generator">
                Create QR <QrCode className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/#generator">
                Single QR <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <ul className="mt-6 divide-y divide-border">
            {rest.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/blog/${p.slug}`}
                  className="group grid grid-cols-1 gap-5 py-6 sm:grid-cols-[240px,1fr]"
                >
                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={p.cover}
                      alt={p.title}
                      loading="lazy"
                      width={480}
                      height={320}
                      className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {CATEGORY_FOR_SLUG[p.slug] || "GUIDE"}
                    </span>
                    <h3 className="mt-2 text-xl font-bold leading-snug group-hover:text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readingTime}</span>
                      <span>·</span>
                      <span>{p.date}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Reserved blank space for manually-inserted Google AdSense unit */}
        <aside className="min-h-[520px]" aria-hidden="true" data-ad-slot="blog-index-sidebar" />
      </section>

      <Footer />
    </div>
  );
}
