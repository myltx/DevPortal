import type { Metadata } from "next";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "DevPortal 开发者门户",
  description: "DevPortal 开发者门户",
};

import CommandPalette from "@/components/command/CommandPalette";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <StyledComponentsRegistry>
          <ThemeProvider>
            <CommandPalette>{children}</CommandPalette>
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
