import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  fetchBookingDetail,
  cancelBookingRequest,
  sendReminderRequest,
  type BookingDetail,
} from "../api";
import { AppHeader } from "../components/AppHeader";
import { MobileShell } from "../components/MobileShell";
import { BellIcon, CloseIcon } from "../components/icons";
import { useT } from "../i18n/i18n-context";
import { formatCurrency } from "../formatters";

const STATUS_COLORS: Record<string, string> = {
  booked: "bg-brand-100 text-brand-700",
  reminded: "bg-amber-100 text-amber-700",
  cancelled: "bg-accent-rose/10 text-accent-rose",
  completed: "bg-accent-green/10 text-accent-green",
};

const STATUS_LABELS: Record<string, string> = {
  booked: "manage.status_booked",
  reminded: "manage.status_reminded",
  cancelled: "manage.status_cancelled",
  completed: "manage.status_completed",
};

export function BookingDetailPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [reminderJustSent, setReminderJustSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchBookingDetail(Number(id))
      .then(setBooking)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    try {
      const updated = await cancelBookingRequest(booking.id, cancelReason || undefined);
      setBooking(updated);
      setShowCancelDialog(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCancelling(false);
    }
  }

  async function handleRemind() {
    if (!booking) return;
    setReminding(true);
    try {
      const updated = await sendReminderRequest(booking.id);
      setBooking(updated);
      setReminderJustSent(true);
      setTimeout(() => setReminderJustSent(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setReminding(false);
    }
  }

  if (loading) {
    return (
      <MobileShell>
        <AppHeader title={t("manage.title")} />
        <main className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
        </main>
      </MobileShell>
    );
  }

  if (error || !booking) {
    return (
      <MobileShell>
        <AppHeader title={t("manage.title")} />
        <main className="px-4 py-8 text-center">
          <p className="text-accent-rose font-semibold">{error || t("common.error")}</p>
          <button
            type="button"
            className="mt-4 px-5 py-3 rounded-button bg-brand-700 text-white font-bold"
            onClick={() => navigate("/")}
          >
            {t("receipt.back_home")}
          </button>
        </main>
      </MobileShell>
    );
  }

  const isCancelled = booking.status === "cancelled";
  const statusKey = STATUS_LABELS[booking.status] ?? "manage.status_booked";
  const statusColor = STATUS_COLORS[booking.status] ?? STATUS_COLORS.booked;

  return (
    <MobileShell>
      <AppHeader title={t("manage.title")} />

      <main className="px-4 py-5 pb-8">
        {/* Status + Confirmation Code */}
        <div className="text-center p-5 rounded-card-lg bg-gradient-to-br from-brand-50 to-white border border-brand-100 mb-4">
          <span className={`inline-flex px-3 py-1 rounded-chip text-xs font-bold uppercase tracking-wider ${statusColor}`}>
            {t(statusKey)}
          </span>
          <h2 className="font-heading text-2xl font-bold text-brand-700 mt-2">
            {booking.confirmationCode}
          </h2>
        </div>

        {/* Reminder just sent toast */}
        {reminderJustSent && (
          <div className="mb-3 p-3 rounded-card bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-semibold text-center animate-[fade-in_0.3s]">
            ✅ {t("manage.reminder_sent")}
          </div>
        )}

        {/* Booking details card */}
        <div className="rounded-card-lg bg-white border border-surface-border shadow-card overflow-hidden mb-4">
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.salon")}</span>
              <span className="font-semibold text-brand-900">{booking.salonName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.stylist")}</span>
              <span className="font-semibold text-brand-900">{booking.stylistName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.datetime")}</span>
              <span className="font-semibold text-brand-900">
                {booking.appointmentDate} • {booking.appointmentTime}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("receipt.payment_method")}</span>
              <span className="font-semibold text-brand-900 capitalize">{booking.paymentMethod}</span>
            </div>
          </div>

          {/* Services */}
          {booking.services.length > 0 && (
            <div className="px-4 pb-4 pt-2 border-t border-surface-border">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("receipt.services")}
              </p>
              <div className="space-y-1.5">
                {booking.services.map((srv) => (
                  <div key={srv.id} className="flex justify-between text-sm">
                    <span className="text-brand-900">{srv.name}</span>
                    <span className="text-brand-700 font-semibold">{formatCurrency(srv.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-brand-900">{t("summary.total")}</span>
            <span className="font-bold text-brand-700 text-lg">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </div>

        {/* Timeline info */}
        {booking.reminderSentAt && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <BellIcon width={14} height={14} />
            <span>{t("manage.reminder_at")}: {new Date(booking.reminderSentAt).toLocaleString()}</span>
          </div>
        )}
        {booking.cancelledAt && (
          <div className="flex items-center gap-2 text-sm text-accent-rose mb-2">
            <CloseIcon width={14} height={14} />
            <span>{t("manage.cancelled_at")}: {new Date(booking.cancelledAt).toLocaleString()}</span>
          </div>
        )}
        {booking.cancelReason && (
          <p className="text-sm text-gray-500 italic mb-4 pl-6">"{booking.cancelReason}"</p>
        )}

        {/* Action buttons */}
        {!isCancelled && (
          <div className="space-y-3 mt-4">
            {/* Send Reminder */}
            <button
              type="button"
              disabled={reminding}
              onClick={handleRemind}
              className="w-full py-3.5 rounded-xl bg-brand-700 text-white font-bold text-sm shadow-button hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <BellIcon width={16} height={16} />
              {reminding ? t("common.loading") : t("manage.send_reminder")}
            </button>

            {/* Cancel Booking */}
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="w-full py-3.5 rounded-xl bg-white text-accent-rose font-bold text-sm border-2 border-accent-rose/30 hover:bg-accent-rose/5 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CloseIcon width={16} height={16} />
              {t("manage.cancel_booking")}
            </button>
          </div>
        )}

        {/* Cancel confirmation dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4 animate-[scale-in_0.2s]">
              <h3 className="font-heading text-lg font-bold text-brand-900 text-center">
                {t("manage.cancel_confirm")}
              </h3>
              <textarea
                className="w-full p-3 rounded-card border border-surface-border text-sm resize-none h-20 focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder={t("manage.cancel_reason")}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 py-3 rounded-button bg-surface-muted text-brand-700 font-bold text-sm border border-surface-border"
                >
                  {t("manage.cancel_no")}
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => void handleCancel()}
                  className="flex-1 py-3 rounded-button bg-accent-rose text-white font-bold text-sm shadow-button active:scale-95 transition-all disabled:opacity-50"
                >
                  {cancelling ? t("common.loading") : t("manage.cancel_yes")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back to home */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-3 mt-4"
        >
          {t("receipt.back_home")}
        </button>
      </main>
    </MobileShell>
  );
}
