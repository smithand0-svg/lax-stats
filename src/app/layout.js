import "./globals.css";
import SiteLogo from "@/components/SiteLogo";

export const metadata = {
  title: "SJJ Lacrosse Stats",
  description: "St. John's Jesuit Lacrosse historical stats",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteLogo />
        {children}
      </body>
    </html>
  );
}
