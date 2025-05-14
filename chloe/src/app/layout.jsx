import { Geist_Mono, Noto_Emoji } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "CHLOE",
};

const monoSpaced = Geist_Mono({ 
  weight: ['400', '700'],
  subsets: ['latin-ext'] 
  });

const emoji = Noto_Emoji({ 
  weight: ['400', '700'],
  subsets: ['latin-ext'] 
  });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${monoSpaced.className}`} >
      <body>
        {children}
      </body>
    </html>
  );
}
