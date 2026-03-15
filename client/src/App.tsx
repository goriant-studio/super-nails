import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { fetchBootstrapData } from "./api";
import { BookingProvider } from "./booking-context";
import { HomePage } from "./pages/home-page";
import { BookingPage } from "./pages/booking-page";
import { SalonPage } from "./pages/salon-page";
import { ServicesPage } from "./pages/services-page";
import type { BootstrapData } from "./types";

function App() {
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
          : "Không thể tải dữ liệu đặt lịch."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-muted">
        <div className="w-full max-w-md p-7 bg-white/90 backdrop-blur-lg rounded-section shadow-card text-center">
          <span className="inline-flex px-3 py-1.5 rounded-chip bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider">
            Super Nails
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-brand-900">
            Đang khởi tạo...
          </h1>
          <p className="mt-2 text-gray-500">
            Đang tải salon, stylist, lịch hẹn và dịch vụ.
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
            Không kết nối được
          </h1>
          <p className="mt-2 text-gray-500">
            {error || "Không có dữ liệu để hiển thị."}
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-button bg-brand-700 text-white font-bold shadow-button hover:bg-brand-600 active:scale-95 transition-all"
            onClick={loadData}
            type="button"
          >
            Thử lại
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
        <Route path="/salons" element={<SalonPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BookingProvider>
  );
}

export default App;
