import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { DecorativeBackground } from "./components/DecorativeBackground";
import { TopBar } from "./components/TopBar";
import { LandingView } from "./views/LandingView";
import { DemoView } from "./views/DemoView";
import { UploadView } from "./views/UploadView";
import { ResultsView } from "./views/ResultsView";

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = { duration: 0.2 };

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <LandingView />
            </motion.div>
          }
        />
        <Route
          path="/demo"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <DemoView />
            </motion.div>
          }
        />
        <Route
          path="/upload"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <UploadView />
            </motion.div>
          }
        />
        <Route
          path="/analysis/:statementId"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <ResultsView />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const location = useLocation();
  const noBuffer = location.pathname === "/" || location.pathname === "/upload";
  return (
    <div style={{ position: "relative", zIndex: 1, paddingTop: noBuffer ? 0 : 56 }}>
      <AnimatedRoutes />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <DecorativeBackground />
        <TopBar />
        <AppContent />
      </div>
    </BrowserRouter>
  );
}
