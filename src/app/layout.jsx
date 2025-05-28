import localFont from 'next/font/local'
import "./globals.css"
import { Analytics } from '@vercel/analytics/next'
import IosZoomFix from '@/app/utils/iosZoomFix';

export const metadata = {
  title: "chloe",
  description: "your digital bestfriend"
};

const monoSpaced = localFont({
  weight: '100 900',
  src: [
    {
      path: '../app/assets/GeistMono-VariableFont_wght.ttf'
    }
  ],
  variable: '--geistMono'
});


export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${monoSpaced.variable}`} >
      <body>
          {children}
        <Analytics />
        <IosZoomFix />
      </body>
    </html>
  );
}
