import { Agentation } from 'agentation';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GlobalJsonLd } from './seo/GlobalJsonLd';
import { AboutPage } from './pages/About';
import { ContactPage } from './pages/Contact';
import { HomePage } from './pages/Home';
import { WorkPage } from './pages/Work';

export default function App() {
  return (
    <HelmetProvider>
      <GlobalJsonLd />
      <BrowserRouter>
        {import.meta.env.DEV ? <Agentation /> : null}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
