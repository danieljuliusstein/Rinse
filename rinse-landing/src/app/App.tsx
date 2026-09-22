import { useState, useCallback } from "react";
import { Routes, Route } from "react-router";
import { SECTIONS, scrollToSection } from "./shared/scroll";
import { DemoModal } from "./layout/DemoModal";
import { HomePage } from "./pages/HomePage";
import { FeaturesPage } from "./pages/FeaturesPage";

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false);

  const handleStartTrial = useCallback(() => {
    scrollToSection(SECTIONS.cta);
  }, []);

  const handleBookDemo = useCallback(() => {
    window.open("mailto:hello@rinse.app?subject=Book%20a%20demo", "_blank");
  }, []);

  const handleOpenDemo = useCallback(() => {
    setDemoOpen(true);
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <HomePage
              onStartTrial={handleStartTrial}
              onOpenDemo={handleOpenDemo}
              onBookDemo={handleBookDemo}
            />
            <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
          </>
        }
      />
      <Route path="/features" element={<FeaturesPage />} />
    </Routes>
  );
}
