import localFont from 'next/font/local';
import "./globals.css";

export const metadata = {
  title: "CHLOE",
  description: "your digital bestie"
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
      </body>
    </html>
  );
}
