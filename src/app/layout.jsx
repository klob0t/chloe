import localFont from 'next/font/local'
import "./globals.css"
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  title: "chloe",
  description: "your digital bestfriend"
};

const monoSpaced = localFont({ 
  src: [
    {
      path: '../app/assets/GeistMono-VariableFont_wght.ttf'
    }
  ]
  });


export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${monoSpaced.className}`} >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
