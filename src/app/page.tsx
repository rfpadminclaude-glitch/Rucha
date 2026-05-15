import Header from "@/components/home/Header";
import AnnouncementBar from "@/components/home/AnnouncementBar";
import Hero from "@/components/home/Hero";
import TopServices from "@/components/home/TopServices";
import IWantTo from "@/components/home/IWantTo";
import Events from "@/components/home/Events";
import News from "@/components/home/News";
import ElectedOfficials from "@/components/home/ElectedOfficials";
import ByTheNumbers from "@/components/home/ByTheNumbers";
import Footer from "@/components/home/Footer";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />
      <Hero />
      <TopServices />
      <IWantTo />
      <Events />
      <News />
      <ElectedOfficials />
      <ByTheNumbers />
      <Footer />
      <ChatWidget />
    </main>
  );
}
