import { useNavigate } from "react-router-dom";

import { useBooking } from "../booking-context";
import { AppHeader } from "../components/AppHeader";
import { MobileShell } from "../components/MobileShell";
import { CheckIcon } from "../components/icons";
import { useT } from "../i18n/i18n-context";
import { formatCurrency } from "../formatters";
import { getTaxRateDisplay, TAX_RATE } from "../tax-utils";

export function SuccessPage() {
  const t = useT();
  const navigate = useNavigate();
  const { confirmation, clearConfirmation, resetBooking } = useBooking();

  if (!confirmation) {
    return (
      <MobileShell>
        <AppHeader title={t("receipt.title")} leading="home" leadingFallbackTo="/" />
        <main className="px-4 py-8 text-center">
          <p className="text-gray-500">{t("common.error")}</p>
          <button
            type="button"
            className="mt-4 px-5 py-3 rounded-button bg-brand-700 text-white font-bold shadow-button"
            onClick={() => navigate("/")}
          >
            {t("receipt.back_home")}
          </button>
        </main>
      </MobileShell>
    );
  }

  const paymentLabel =
    confirmation.paymentMethod === "card"
      ? t("payment.card")
      : confirmation.paymentMethod === "cash"
        ? t("payment.cash")
        : t("payment.digital_wallet");

  return (
    <MobileShell>
      <AppHeader
        title={t("receipt.title")}
        leading="home"
        onLeadingClick={() => clearConfirmation()}
        leadingFallbackTo="/"
      />

      <main className="px-4 py-6 pb-8">
        {/* Success animation */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-accent-green/10 flex items-center justify-center mb-4 animate-[scale-in_0.5s_ease-out]">
            <div className="w-14 h-14 rounded-full bg-accent-green flex items-center justify-center shadow-lg">
              <CheckIcon width={28} height={28} className="text-white" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold text-brand-900">
            {t("booking.success_title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("receipt.success_msg")}</p>
        </div>

        {/* Confirmation code */}
        <div className="text-center p-4 rounded-card-lg bg-gradient-to-br from-brand-50 to-white border border-brand-100 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t("receipt.confirmation_code")}
          </p>
          <h2 className="font-heading text-2xl font-bold text-brand-700 mt-1">
            {confirmation.confirmationCode}
          </h2>
        </div>

        {/* Receipt card */}
        <div className="rounded-card-lg bg-white border border-surface-border shadow-card overflow-hidden">
          {/* Salon & Stylist */}
          <div className="p-4 border-b border-surface-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.salon")}</span>
              <span className="font-semibold text-brand-900">{confirmation.salonName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.stylist")}</span>
              <span className="font-semibold text-brand-900">{confirmation.stylistName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.datetime")}</span>
              <span className="font-semibold text-brand-900">
                {confirmation.appointmentDate} • {confirmation.appointmentTime}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.payment_method")}</span>
              <span className="font-semibold text-brand-900">{paymentLabel}</span>
            </div>
          </div>

          {/* Services list */}
          {confirmation.serviceNames.length > 0 && (
            <div className="p-4 border-b border-surface-border">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("receipt.services")}
              </p>
              <div className="space-y-1.5">
                {confirmation.serviceNames.map((name) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span className="text-brand-900">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>{t("summary.subtotal")}</span>
              <span>{formatCurrency(confirmation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{t("summary.tax", { rate: getTaxRateDisplay(TAX_RATE) })}</span>
              <span>{formatCurrency(confirmation.taxAmount)}</span>
            </div>
            {confirmation.tipAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{t("summary.tip")}</span>
                <span>{formatCurrency(confirmation.tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-brand-900 text-base pt-2 border-t border-gray-200">
              <span>{t("summary.total")}</span>
              <span>{formatCurrency(confirmation.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 space-y-3">
          {/* Track Visit */}
          <button
            type="button"
            onClick={() => navigate(`/tour/${confirmation.bookingId}`)}
            className="w-full py-3.5 rounded-xl bg-brand-700 text-white font-bold text-sm shadow-button hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            📍 {t("booking.track_visit")}
          </button>

          {/* Manage Booking */}
          <button
            type="button"
            onClick={() => navigate(`/booking/${confirmation.bookingId}`)}
            className="w-full py-3.5 rounded-xl bg-white text-brand-700 font-bold text-sm border-2 border-brand-200 hover:bg-brand-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            🔔 {t("manage.title")}
          </button>

          {/* Book Another */}
          <button
            type="button"
            onClick={() => {
              resetBooking();
              navigate("/booking");
            }}
            className="w-full py-3.5 rounded-xl bg-surface-muted text-brand-700 font-bold text-sm border border-surface-border hover:bg-gray-100 active:scale-95 transition-all"
          >
            {t("receipt.book_another")}
          </button>

          {/* Back to Home */}
          <button
            type="button"
            onClick={() => {
              clearConfirmation();
              navigate("/");
            }}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            {t("receipt.back_home")}
          </button>
        </div>
      </main>
    </MobileShell>
  );
}
