import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { MobileShell } from "../components/MobileShell";
import { TourTimeline } from "../components/tour-timeline";
import { FeedbackForm } from "../components/feedback-form";
import { SocialShare } from "../components/social-share";
import { useT } from "../i18n/i18n-hooks";
import { formatCurrency } from "../formatters";
import type { TourStatus } from "../tour-status";
import { isStatusReached } from "../tour-status";

/**
 * Tour page showing the full lifecycle of a booking.
 *
 * In a real app, this would fetch tour data from the backend.
 * For now, we use a local demo state that allows advancing through statuses.
 */
export function TourPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const t = useT();

  // Demo state — in production, fetch from backend via booking_statuses table
  const [currentStatus, setCurrentStatus] = useState<TourStatus>("booked");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);

  // Mock booking data — in production, fetch from backend
  const mockBooking = {
    id: Number(bookingId) || 1,
    salonName: "Super Nails - Riverside Q7",
    stylistName: "Linh",
    date: "2026-03-16",
    time: "14:00",
    services: ["Shine Combo 2", "French tip soft"],
    subtotal: 5400,
    tax: 479,
    tip: 972,
    total: 6851,
    paymentMethod: "card" as const,
  };

  // Demo: advance status
  const statusFlow: TourStatus[] = [
    "booked",
    "confirmed",
    "in_progress",
    "completed",
    "feedback_pending",
  ];

  function advanceStatus() {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx >= 0 && idx < statusFlow.length - 1) {
      setCurrentStatus(statusFlow[idx + 1]);
    }
  }

  function handleFeedback(rating: number) {
    setFeedbackRating(rating);
    setFeedbackSubmitted(true);
    setCurrentStatus("feedback_done");
  }

  function handleShared() {
    setCurrentStatus("shared");
  }

  return (
    <MobileShell>
      <AppHeader
        title={t("tour.title")}
        leading="back"
        onLeadingClick={() => navigate("/")}
      />

      <div className="px-4 py-6 space-y-8 pb-24">
        {/* Booking summary card */}
        <div className="p-5 bg-white rounded-2xl shadow-card border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              #{mockBooking.id}
            </span>
            <span className="text-xs text-gray-400">
              {mockBooking.date} • {mockBooking.time}
            </span>
          </div>
          <h2 className="font-heading text-lg font-bold text-brand-900">
            {mockBooking.salonName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Stylist: {mockBooking.stylistName}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            {mockBooking.services.map((s) => (
              <p key={s} className="text-sm text-gray-600">
                • {s}
              </p>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>{t("summary.subtotal")}</span>
              <span>{formatCurrency(mockBooking.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{t("summary.tax", { rate: "8.875" })}</span>
              <span>{formatCurrency(mockBooking.tax)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{t("summary.tip")}</span>
              <span>{formatCurrency(mockBooking.tip)}</span>
            </div>
            <div className="flex justify-between font-bold text-brand-900 text-base pt-1">
              <span>{t("summary.total")}</span>
              <span>{formatCurrency(mockBooking.total)}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5 bg-white rounded-2xl shadow-card border border-gray-100">
          <TourTimeline currentStatus={currentStatus} />
        </div>

        {/* Demo advance button (for demo purposes) */}
        {statusFlow.indexOf(currentStatus) >= 0 &&
          statusFlow.indexOf(currentStatus) < statusFlow.length - 1 && (
            <button
              type="button"
              onClick={advanceStatus}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all"
            >
              ⏭️ Demo: Advance to next status
            </button>
          )}

        {/* Feedback form — show when completed or feedback_pending */}
        {isStatusReached(currentStatus, "feedback_pending") &&
          !feedbackSubmitted && (
            <div className="p-5 bg-white rounded-2xl shadow-card border border-gray-100">
              <FeedbackForm onSubmit={handleFeedback} />
            </div>
          )}

        {/* Social share — show after feedback */}
        {feedbackSubmitted && (
          <div className="p-5 bg-white rounded-2xl shadow-card border border-gray-100">
            <SocialShare
              salonName={mockBooking.salonName}
              rating={feedbackRating}
              bookingId={mockBooking.id}
            />
            {currentStatus !== "shared" && (
              <button
                type="button"
                onClick={handleShared}
                className="mt-3 w-full py-2.5 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-all"
              >
                ✅ Mark as shared
              </button>
            )}
          </div>
        )}

        {/* Completed state */}
        {currentStatus === "shared" && (
          <div className="text-center p-6 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-2xl">
            <span className="text-4xl">🎊</span>
            <p className="mt-3 font-heading font-bold text-brand-900">
              Thank you for your visit!
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We look forward to seeing you again.
            </p>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
