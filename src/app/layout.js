import "./globals.css";

export const metadata = {
  title: "Voting Calon Kahim & Wakahim HMIF 2026",
  description: "Platform Voting Internal Penentuan Calon Ketua & Wakil Ketua Himpunan HMIF 2026",
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
