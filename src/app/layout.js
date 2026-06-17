import "./globals.css";

export const metadata = {
  title: "Website Evaluasi & Apresiasi Anggota HMIF",
  description: "Platform Internal Evaluasi, Apresiasi, dan Umpan Balik Akhir Kepengurusan HMIF 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#F9F6F0] text-[#1A1D20]">
        {children}
      </body>
    </html>
  );
}
