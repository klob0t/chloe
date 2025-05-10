import { Share_Tech_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "CHLOE",
};

const shareTechMono = Share_Tech_Mono({ 
  weight: "400", 
  subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={shareTechMono.className}>
        {children}
      </body>
    </html>
  );
}
