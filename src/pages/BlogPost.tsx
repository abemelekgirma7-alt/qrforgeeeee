import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { Button } from "@/components/ui/button";
import NotFound from "./NotFound";
import johnSmithAuthor from "@/assets/blog/john-smith-author.jpg";

export default function BlogPost() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} · QR Forge Blog`;
    upsertMeta("name", "description", post.description);
    upsertMeta("name", "keywords", post.keywords.join(", "));
    upsertMeta("property", "og:title", post.title);
    upsertMeta("property", "og:description", post.description);
    upsertMeta("property", "og:type", "article");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", post.title);
    upsertMeta("name", "twitter:description", post.description);
    const canonicalHref = `${window.location.origin}/blog/${post.slug}`;
    upsertLink("canonical", canonicalHref);
    upsertMeta("property", "og:url", canonicalHref);
    upsertJsonLd("blogpost-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      image: post.cover ? [`${window.location.origin}${post.cover}`] : undefined,
      keywords: post.keywords.join(", "),
      datePublished: post.date,
      dateModified: post.date,
      author: { "@type": "Person", name: "John Smith" },
      publisher: {
        "@type": "Organization",
        name: "QR Forge",
        logo: { "@type": "ImageObject", url: `${window.location.origin}/favicon.svg` },
      },
      mainEntityOfPage: canonicalHref,
    });
    upsertJsonLd("breadcrumb-jsonld", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${window.location.origin}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: canonicalHref },
      ],
    });
    upsertJsonLd("howto-jsonld", {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: post.title,
      description: post.description,
      step: post.body.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.heading,
        text: s.paragraphs[0] ?? s.heading,
      })),
    });
  }, [post]);

  // reading progress
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!post) return <NotFound />;

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navbar blogLinkLabel="All articles" />

      {/* breadcrumb */}
      <div className="container mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-primary">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{post.title.slice(0, 60)}{post.title.length > 60 ? "…" : ""}</span>
      </div>

      <div className="container mt-8 grid gap-10 lg:grid-cols-[1fr,300px]">
        {/* Main article */}
        <article>
          <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            QR Code Guide
          </span>
          <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-muted-foreground sm:text-lg">{post.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <img
              src={johnSmithAuthor}
              alt="John Smith"
              loading="lazy"
              width={1024}
              height={1024}
              className="h-10 w-10 rounded-full border object-cover"
            />
            <span>By <Link to="#" className="font-medium text-primary hover:underline">John Smith</Link></span>
            <span>·</span>
            <span>Updated {post.date}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingTime} read</span>
          </div>

          {/* progress bar */}
          <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-[11px] text-muted-foreground">{Math.round(progress)}% Complete</div>

          <img
            src={post.cover}
            alt={post.title}
            width={1280}
            height={720}
            className="mt-6 w-full rounded-2xl border object-cover"
          />

          <div className="mt-10 space-y-10">
            {post.body.map((s, i) => (
              <section key={i}>
                <h2 className="text-2xl font-bold tracking-tight">
                  <span className="text-primary">{i + 1}.</span> {s.heading}
                </h2>
                <div className="mt-3 space-y-4">
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="text-[15px] leading-relaxed text-foreground/90">{p}</p>
                  ))}
                </div>
                {s.image && (
                  <figure className="mt-6">
                    <img
                      src={s.image}
                      alt={s.imageAlt || s.heading}
                      loading="lazy"
                      width={1280}
                      height={720}
                      className="w-full rounded-2xl border object-cover"
                    />
                  </figure>
                )}
              </section>
            ))}
          </div>

          {/* Continue Learning - full width below article */}
          {related.length > 0 && (
            <aside className="mt-16 rounded-2xl border-2 border-primary/30 bg-card p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight">Continue Learning About QR Codes</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/blog/${r.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl bg-background transition-transform hover:-translate-y-0.5"
                  >
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={r.cover}
                        alt={r.title}
                        loading="lazy"
                        width={400}
                        height={240}
                        className="aspect-[5/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="pt-3">
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary">
                        {r.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{r.readingTime} read</span>
                        <span className="font-medium text-primary">Read More →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </article>

        {/* Reserved blank space for manually-inserted Google AdSense unit */}
        <aside className="hidden lg:block" aria-hidden="true">
          <div className="sticky top-24 min-h-[600px]" data-ad-slot="article-sidebar" />
        </aside>
      </div>

      <div className="container mt-16 max-w-3xl text-xs text-muted-foreground">
        <strong>Keywords:</strong> {post.keywords.join(" · ")}
      </div>

      <Footer />
    </div>
  );
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
