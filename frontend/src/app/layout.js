import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Safeguard | Women Safety & Emergency Assistance Platform",
  description: "Instant emergency assistance, real-time live location sharing, and volunteer proximity alerts for women's safety.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0b0f19] flex flex-col text-gray-200">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
