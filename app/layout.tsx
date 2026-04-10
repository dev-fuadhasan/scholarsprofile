import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholars Profile",
  description: "Student scholars profiles and status"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 font-body">
        {children}
      </body>
    </html>
  );
}
