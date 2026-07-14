import "@/src/styles.css";
import { CartProvider } from "@/src/lib/cart-context";
import { NoLocalStorage } from "@/src/components/no-local-storage";
import { ClientToaster } from "@/src/components/client-toaster";

export const metadata = {
  title: "Industrial Sewing Parts",
  description: "Browse compatible sewing machine parts and place orders with a simple checkout experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="paper-grain antialiased">
        <NoLocalStorage />
        <CartProvider>
          {children}
          <ClientToaster />
        </CartProvider>
      </body>
    </html>
  );
}
