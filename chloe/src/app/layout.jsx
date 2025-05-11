import { Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "CHLOE",
};

const shareTechMono = Spline_Sans_Mono({ 
  weight: ['400', '700'],
  subsets: ['latin-ext'] 
  });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={shareTechMono.className}>
        {children}
      </body>
    </html>
  );
}
