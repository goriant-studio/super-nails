import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { fetchBootstrapData } from "./api";
import { BookingProvider } from "./booking-context";
import { I18nProvider, useT, useLocale } from "./i18n/i18n-context";
import { HomePage } from "./pages/home-page";
import { BookingPage } from "./pages/booking-page";
import { SuccessPage } from "./pages/success-page";
import { BookingDetailPage } from "./pages/booking-detail-page";
import { SalonPage } from "./pages/salon-page";
import { ServicesPage } from "./pages/services-page";
import { TourPage } from "./pages/tour-page";
import type { BootstrapData } from "./types";

function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "vi" : "en")}
      className="fixed top-3 right-3 z-50 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-sm text-xs font-bold text-brand-700 hover:bg-brand-50 active:scale-95 transition-all"
      aria-label="Toggle language"
    >
      {locale === "en" ? "🇻🇳 VI" : "🇺🇸 EN"}
    </button>
  );
}

function AppContent() {
  const t = useT();
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const nextData = await fetchBootstrapData();
      setData(nextData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("app.error_desc")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-muted">
        <div className="w-full max-w-md p-7 bg-white/90 backdrop-blur-lg rounded-section shadow-card text-center">
          <span className="inline-flex px-3 py-1.5 rounded-chip bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider">
            Super Nails
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-brand-900">
            {t("app.loading")}
          </h1>
          <p className="mt-2 text-gray-500">
            {t("app.loading_desc")}
          </p>
          <div className="mt-5 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-muted">
        <div className="w-full max-w-md p-7 bg-white/90 backdrop-blur-lg rounded-section shadow-card text-center border border-accent-rose/30">
          <span className="inline-flex px-3 py-1.5 rounded-chip bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider">
            Super Nails
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-brand-900">
            {t("app.error_title")}
          </h1>
          <p className="mt-2 text-gray-500">
            {error || t("app.error_desc")}
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-button bg-brand-700 text-white font-bold shadow-button hover:bg-brand-600 active:scale-95 transition-all"
            onClick={loadData}
            type="button"
          >
            {t("app.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <BookingProvider data={data} refreshData={loadData}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/success" element={<SuccessPage />} />
        <Route path="/booking/:id" element={<BookingDetailPage />} />
        <Route path="/salons" element={<SalonPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/tour/:bookingId" element={<TourPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BookingProvider>
  );
}

function App() {
  return (
    <I18nProvider>
      <LanguageToggle />
      <AppContent />
    </I18nProvider>
  );
}

export default App;
