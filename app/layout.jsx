import "./globals.css";

export const metadata = {
  title: "Scoutool Batch",
  description: "Scoutool-style mail link generator and batch launcher",
  verification: {
    google: "oOcGx7wm08vZ2eTeKoLbZaM9bqd_4VMl2tfFPJkGYhU",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="oOcGx7wm08vZ2eTeKoLbZaM9bqd_4VMl2tfFPJkGYhU" />
      </head>
      <body>{children}</body>
    </html>
  );
}
