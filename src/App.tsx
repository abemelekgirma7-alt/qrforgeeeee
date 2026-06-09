import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index.tsx";
import { AuthProvider } from "./hooks/useAuth";
import { ScrollToTop } from "./components/ScrollToTop";
import { CookieConsent } from "./components/site/CookieConsent";

// Lazy-load non-critical routes for smaller initial bundle
const BlogIndex = lazy(() => import("./pages/BlogIndex.tsx"));
const BlogPost = lazy(() => import("./pages/BlogPost.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Cookies = lazy(() => import("./pages/Cookies.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const ShareReview = lazy(() => import("./pages/ShareReview.tsx"));
const AdminReviews = lazy(() => import("./pages/AdminReviews.tsx"));
const Scanner = lazy(() => import("./pages/Scanner.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
          <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/share-review" element={<ShareReview />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
