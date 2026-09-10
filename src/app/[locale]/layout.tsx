import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

// Body / UI sans. DESIGN.md names StyreneB with Inter as the documented substitute.
const bodySans = Inter({
  variable: "--font-body-sans",
  subsets: ["latin"],
});

// Display serif. DESIGN.md names Copernicus / Tiempos Headline; Source Serif 4 is
// the closest freely available transitional serif and holds up at display sizes.
const displaySerif = Source_Serif_4({
  variable: "--font-display-serif",
  subsets: ["latin"],
  display: "swap",
});

const codeMono = JetBrains_Mono({
  variable: "--font-code-mono",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: {
      default: "Notes from Yoichi Ozaki",
      template: "%s | Notes from Yoichi Ozaki",
    },
    description: dict.home.description,
    icons: {
      icon: "/favicon.svg",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <html
      lang={locale}
      className={`${bodySans.variable} ${displaySerif.variable} ${codeMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <Header locale={locale as Locale} dict={dict} />
          <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
            {children}
          </main>
          <Footer dict={dict} />
        </ThemeProvider>
      </body>
    </html>
  );
}
