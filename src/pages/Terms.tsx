import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function Terms() {
  useEffect(() => { document.title = "Terms of Service"; }, []);
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
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last Updated: May 30, 2026</p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Welcome to QR Forge ("Company", "we", "our", or "us"). These Terms of Service ("Terms") govern your access to and use of our website located at{" "}
            <a href="https://onlineqrcodegenerator.lovable.app/" className="text-primary hover:underline">https://onlineqrcodegenerator.lovable.app/</a> (the "Service").
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            By accessing or using the Service, you agree to be bound by these Terms. If you do not agree with these Terms, you may not use the Service.
          </p>

          <Section title="1. Eligibility">
            <p>You must be at least 13 years old to use the Service.</p>
            <p>By using the Service, you represent and warrant that you meet this requirement and have the legal capacity to enter into these Terms.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>QR Forge provides tools and services for generating QR codes and related content.</p>
            <p>We may modify, suspend, or discontinue any feature of the Service at any time without prior notice.</p>
            <p>We do not guarantee that the Service will always be available, uninterrupted, secure, or error-free.</p>
          </Section>

          <Section title="3. User Responsibilities">
            <p>You agree to use the Service only for lawful purposes.</p>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Violate any applicable laws or regulations.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Interfere with the operation of the Service.</li>
              <li>Upload or distribute malicious software, viruses, or harmful code.</li>
              <li>Use the Service for fraudulent, deceptive, or illegal activities.</li>
              <li>Abuse, overload, or disrupt our infrastructure.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use Policy">
            <p>You may not use QR Forge to create QR codes that link to or promote:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Illegal content.</li>
              <li>Malware, spyware, or phishing websites.</li>
              <li>Fraudulent schemes.</li>
              <li>Copyright-infringing material.</li>
              <li>Harmful or deceptive content.</li>
              <li>Content that violates applicable laws.</li>
            </ul>
            <p>We reserve the right to restrict or terminate access for users who violate these rules.</p>
          </Section>

          <Section title="5. Accounts">
            <p>Some features may require account registration.</p>
            <p>You are responsible for:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Providing accurate information.</li>
            </ul>
            <p>You must notify us immediately of any unauthorized use of your account.</p>
          </Section>

          <Section title="6. Intellectual Property">
            <p>The Service, including its design, software, trademarks, logos, text, graphics, and functionality, is owned by QR Forge or its licensors and is protected by applicable intellectual property laws.</p>
            <p>These Terms do not grant you ownership of the Service or any intellectual property rights.</p>
          </Section>

          <Section title="7. User Content">
            <p>You retain ownership of content you submit to the Service.</p>
            <p>By submitting content, you grant us a limited, non-exclusive license to process, store, and display such content solely as necessary to provide the Service.</p>
            <p>You are solely responsible for the content you create, upload, or distribute through the Service.</p>
          </Section>

          <Section title="8. Advertisements">
            <p>The Service may display advertisements provided by third-party advertising networks, including Google AdSense.</p>
            <p>We are not responsible for the content, accuracy, products, or services advertised by third parties.</p>
            <p>Your interactions with advertisers are solely between you and the advertiser.</p>
          </Section>

          <Section title="9. Third-Party Services">
            <p>The Service may contain links to third-party websites, services, or resources.</p>
            <p>We do not control and are not responsible for:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Third-party content.</li>
              <li>Privacy practices.</li>
              <li>Availability of external websites.</li>
              <li>Products or services offered by third parties.</li>
            </ul>
            <p>Use of third-party services is at your own risk.</p>
          </Section>

          <Section title="10. Paid Services">
            <p>We may offer paid features, subscriptions, or services in the future.</p>
            <p>If payment services are provided:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Prices may change at any time.</li>
              <li>Additional terms may apply.</li>
              <li>Payments may be processed by third-party payment providers.</li>
              <li>All purchases are subject to applicable laws and refund policies.</li>
            </ul>
          </Section>

          <Section title="11. Disclaimer of Warranties">
            <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS.</p>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, QR FORGE DISCLAIMS ALL WARRANTIES, INCLUDING:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>ACCURACY</li>
              <li>RELIABILITY</li>
              <li>AVAILABILITY</li>
            </ul>
            <p>WE DO NOT GUARANTEE THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED.</p>
          </Section>

          <Section title="12. Limitation of Liability">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, QR FORGE SHALL NOT BE LIABLE FOR:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>INDIRECT DAMAGES</li>
              <li>INCIDENTAL DAMAGES</li>
              <li>CONSEQUENTIAL DAMAGES</li>
              <li>SPECIAL DAMAGES</li>
              <li>LOSS OF PROFITS</li>
              <li>LOSS OF DATA</li>
              <li>BUSINESS INTERRUPTION</li>
            </ul>
            <p>ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE.</p>
            <p>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO US DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM OR ONE HUNDRED U.S. DOLLARS (USD $100), WHICHEVER IS GREATER.</p>
          </Section>

          <Section title="13. Indemnification">
            <p>You agree to defend, indemnify, and hold harmless QR Forge, its owners, affiliates, partners, employees, and service providers from any claims, liabilities, damages, losses, or expenses arising out of:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Your use of the Service.</li>
              <li>Your violation of these Terms.</li>
              <li>Your violation of any third-party rights.</li>
            </ul>
          </Section>

          <Section title="14. Termination">
            <p>We may suspend or terminate your access to the Service at any time, with or without notice, if:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>You violate these Terms.</li>
              <li>We believe your use poses a risk to the Service.</li>
              <li>Required by law.</li>
            </ul>
            <p>Upon termination, your right to use the Service immediately ceases.</p>
          </Section>

          <Section title="15. Privacy">
            <p>
              Your use of the Service is also governed by our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
              <Link to="/cookies" className="text-primary hover:underline">Cookies Policy</Link>.
            </p>
            <p>Please review those documents to understand how information is collected and processed.</p>
          </Section>

          <Section title="16. International Users">
            <p>The Service may be accessed from countries around the world.</p>
            <p>You are responsible for complying with the laws applicable in your jurisdiction.</p>
          </Section>

          <Section title="17. Governing Law">
            <p>These Terms shall be governed by and interpreted in accordance with the laws of Ethiopia, without regard to conflict-of-law principles.</p>
            <p>Any disputes arising under these Terms shall be subject to the competent courts of Ethiopia.</p>
          </Section>

          <Section title="18. Severability">
            <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
          </Section>

          <Section title="19. Changes to These Terms">
            <p>We reserve the right to modify these Terms at any time.</p>
            <p>Updated versions will be posted on this page with a revised "Last Updated" date.</p>
            <p>Your continued use of the Service after changes become effective constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section title="20. Contact Us">
            <p>If you have any questions regarding these Terms of Service, please contact us through:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Link to="/contact" className="text-primary hover:underline">
                  Visit our Contact page
                </Link>
              </li>
              <li>Or through any contact information provided on the Website.</li>
            </ul>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
