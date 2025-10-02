import Image from "next/image";
import styles from "./page.module.css";
import Landing from "./components/LandingPage";

export default function Home() {
  return (
    <div className={styles.page}>
      <Landing />
    </div>
  );
}
