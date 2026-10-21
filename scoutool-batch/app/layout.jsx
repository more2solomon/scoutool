import "./globals.css";

export const metadata = {
  title: "Scoutool Batch",
  description: "Scoutool-style mail link generator and batch launcher"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
