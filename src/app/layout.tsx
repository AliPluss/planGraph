import type { Metadata } from "next";
import "./globals.css";
import I18nProvider from "@/components/plangraph/I18nProvider";
import AppShell from "@/components/plangraph/AppShell";

export const metadata: Metadata = {
  title: "PlanGraph",
  description: "Local-first project planning with executable per-step plans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className="dark h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
