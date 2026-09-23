import "./globals.css";
import "@fontsource/graduate/400.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "SJJ Lacrosse Stats",
  description: "St. John's Jesuit lacrosse history, records, and stats since 1990.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
