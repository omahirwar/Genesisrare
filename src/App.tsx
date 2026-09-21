import { useEffect, useState } from 'react';
import { Web3Provider, useWeb3 } from './lib/web3';
import { WhitelistProvider } from './components/WhitelistProvider';
import { IS_UNDER_MAINTENANCE } from './lib/config';
import MaintenancePage from './components/MaintenancePage';
import WalletGate from './components/WalletGate';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import ArcSection from './components/ArcSection';
import WLChecker from './components/WLChecker';
import Roadmap from './components/Roadmap';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import MintRoutePage from './components/MintRoutePage';

function currentPathname() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function MainSite() {
  const { isConnected } = useWeb3();

  // If maintenance mode is active, show the maintenance screen immediately
  if (IS_UNDER_MAINTENANCE) {
    return <MaintenancePage />;
  }

  // If user has not connected their Web3 wallet, show the gatekeeper
  if (!isConnected) {
    return <WalletGate />;
  }

  // Once connected, full website is unlocked
  return (
    <div className="min-h-screen bg-[#eeeeee] text-[#111] flex flex-col font-['Archivo'] selection:bg-[#111] selection:text-[#eeeeee]">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <ArcSection />
        <section id="wl-checker-section" className="bg-[#eeeeee]">
          <WLChecker />
        </section>
        <Roadmap />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(currentPathname);

  useEffect(() => {
    const sync = () => setPathname(currentPathname());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  if (IS_UNDER_MAINTENANCE) {
    return <MaintenancePage />;
  }

  return (
    <Web3Provider>
      {pathname === '/mint' ? (
        <MintRoutePage />
      ) : (
        <WhitelistProvider>
          <MainSite />
        </WhitelistProvider>
      )}
    </Web3Provider>
  );
}
