import "./globals.css";

export const metadata = {
  title: "Scout Mail",
  description: "Scoutool queue dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
