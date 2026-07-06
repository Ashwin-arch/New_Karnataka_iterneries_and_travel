import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/AuthContext";

export const metadata: Metadata = {
  title: "Incredible Karnataka",
  description: "Discover authentic places, hidden gems and local stories across Karnataka",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d0d16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0f" }}>
        <AuthProvider>
          <div id="mobile-root">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
