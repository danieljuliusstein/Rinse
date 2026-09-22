import { useState } from 'react';
import { Routes, Route } from 'react-router';
import { MotionConfig } from 'motion/react';
import { DemoModal } from './layout/DemoModal';
import { WaitlistModal } from './layout/WaitlistModal';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { APP_STORE_URL } from './shared/urls';
export default function App() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [interest, setInterest] = useState<'free' | 'starter' | null>(null);
  const start = (plan: 'free' | 'starter' = 'free') => { if (APP_STORE_URL) window.location.assign(APP_STORE_URL); else setInterest(plan); };
  return <MotionConfig reducedMotion="user"><Routes>
    <Route path="/" element={<HomePage onStartTrial={start} onOpenDemo={() => setDemoOpen(true)} onBookDemo={() => setDemoOpen(true)} />} />
    <Route path="/features" element={<FeaturesPage />} />
  </Routes><DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} /><WaitlistModal interest={interest} onClose={() => setInterest(null)} /></MotionConfig>;
}
