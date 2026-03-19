import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'English Language Course',
  description: 'Course Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50 text-slate-900 flex flex-col min-h-screen`}>
        {children}
        <footer className="w-full pt-4 pb-4 text-center mt-auto z-50 pointer-events-none">
          <p className="text-xs text-gray-500 font-medium">
            Built with 🖤 by <span className="font-bold">dspaceweb</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
