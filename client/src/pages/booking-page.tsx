import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useBooking } from "../booking-context";
import { AppHeader } from "../components/AppHeader";
import { MobileShell } from "../components/MobileShell";
import { TimeSlotButton } from "../components/TimeSlotButton";
import {
  formatAvailabilityHint,
  formatCurrency,
  formatDateLabel,
  getWeekendLabel,
} from "../formatters";
import {
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  HomeIcon,
  LightbulbIcon,
  ScissorsIcon,
  UserIcon,
} from "../components/icons";

interface StepProps {
  number: number;
  title: string;
  status: "complete" | "active" | "pending";
  children: ReactNode;
}

function BookingStep({ number, title, status, children }: StepProps) {
  return (
    <section className="flex gap-3">
      {/* Rail */}
      <div className="relative flex flex-col items-center">
        {/* Vertical line */}
        <span
          className={`absolute top-0 -bottom-5 w-1 rounded-chip ${
            status === "complete"
              ? "bg-gradient-to-b from-brand-700 to-brand-300"
              : "bg-gray-200"
          }`}
        />
        {/* Dot */}
        <span
          className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full border-4 border-surface-muted ${
            status === "complete" || status === "active"
              ? "bg-brand-700 text-white"
              : "bg-gray-200 text-transparent"
          }`}
        >
          {status === "complete" ? <CheckIcon width={14} height={14} /> : null}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-5">
        <h2 className="font-heading text-base font-bold text-brand-700 mb-3">
          {number}. {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export function BookingPage() {
  const {
    data,
    selectedSalon,
    selectedStylist,
    selectedDate,
    selectedTime,
    selectedServices,
    availableStylists,
    availableDates,
    slotsForSelectedDate,
    needsConsultation,
    chooseDate,
    chooseStylist,
    chooseTime,
    selectedTotal,
    canCheckout,
    submitBooking,
    submitting,
    submissionError,
    confirmation,
    clearConfirmation,
  } = useBooking();

  const referenceDate = availableDates[0] ?? selectedDate;
  const nextDate = availableDates.find((date) => date !== selectedDate) ?? null;
  const nextDateSlots = data.timeSlots.filter(
    (slot) =>
      slot.salonId === selectedSalon?.id &&
      slot.date === nextDate &&
      slot.isAvailable
  );
  const salonDone = Boolean(selectedSalon);
  const scheduleDone = Boolean(
    selectedSalon && selectedStylist && selectedDate && selectedTime
  );
  const servicesDone = Boolean(selectedServices.length > 0 || needsConsultation);

  return (
    <MobileShell>
      <AppHeader
        title="Đặt lịch giữ chỗ"
        leading="home"
        onLeadingClick={() => clearConfirmation()}
      />

      <main className="px-4 py-4 pb-8">
        {/* Hero banner */}
        <div className="flex items-center justify-between p-4 rounded-card-lg bg-gradient-to-br from-brand-50 to-white border border-brand-100 mb-4">
          <div>
            <span className="inline-flex px-2.5 py-1 rounded-chip bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider">
              PWA + SQLite
            </span>
            <p className="text-sm font-semibold text-gray-500 mt-2">
              Mobile-first booking
            </p>
          </div>
          <div className="w-11 h-11 flex items-center justify-center rounded-card bg-brand-700 text-white shadow-button">
            <HomeIcon width={18} height={18} />
          </div>
        </div>

        {/* Confirmation banner */}
        {confirmation ? (
          <div className="flex items-center justify-between gap-3 p-4 rounded-card-lg bg-accent-green-light border border-accent-green/20 mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">
                Đã giữ chỗ thành công
              </p>
              <h3 className="font-heading text-lg font-bold text-accent-green mt-0.5">
                {confirmation.confirmationCode}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {selectedSalon?.name} lúc {selectedTime || "--"}
              </p>
            </div>
            <button
              className="px-3 py-2 rounded-button bg-white text-brand-700 text-sm font-semibold border border-brand-200"
              onClick={clearConfirmation}
              type="button"
            >
              Đóng
            </button>
          </div>
        ) : null}

        {/* Booking steps */}
        <div className="space-y-0">
          {/* Step 1: Chọn salon */}
          <BookingStep
            number={1}
            title="Chọn salon"
            status={salonDone ? "complete" : "active"}
          >
            <Link
              className="flex items-center gap-3 p-3.5 rounded-card bg-surface-muted border border-surface-border shadow-card hover:shadow-card-hover transition-shadow"
              to="/salons"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-card bg-white text-brand-700">
                <HomeIcon width={20} height={20} />
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-brand-900">
                  {selectedSalon
                    ? selectedSalon.shortAddress
                    : "Xem tất cả salon"}
                </strong>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {selectedSalon
                    ? `${selectedSalon.district}, ${selectedSalon.city}`
                    : "Tìm chi nhánh gần bạn bất cứ lúc nào"}
                </p>
              </div>
              <ChevronRightIcon
                width={16}
                height={16}
                className="text-gray-300 flex-shrink-0"
              />
            </Link>
          </BookingStep>

          {/* Step 2: Chọn ngày, giờ & stylist */}
          <BookingStep
            number={2}
            title="Chọn ngày, giờ và stylist"
            status={
              scheduleDone ? "complete" : salonDone ? "active" : "pending"
            }
          >
            {/* Stylist row */}
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {availableStylists.map((stylist) => (
                <button
                  key={stylist.id}
                  className={`flex-shrink-0 flex items-center gap-2.5 min-w-[150px] p-2.5 rounded-card border transition-all active:scale-95 ${
                    selectedStylist?.id === stylist.id
                      ? "bg-brand-700 text-white border-brand-700 shadow-button"
                      : "bg-white text-brand-900 border-surface-border shadow-card"
                  }`}
                  onClick={() => chooseStylist(stylist.id)}
                  type="button"
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                      selectedStylist?.id === stylist.id
                        ? "bg-white/20"
                        : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {stylist.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm font-bold truncate">
                      {stylist.name}
                    </strong>
                    <small
                      className={`block text-[11px] truncate ${
                        selectedStylist?.id === stylist.id
                          ? "text-white/70"
                          : "text-gray-400"
                      }`}
                    >
                      {stylist.title}
                    </small>
                  </span>
                </button>
              ))}
            </div>

            {/* Date info card */}
            <div className="flex items-center gap-3 p-3.5 rounded-card bg-surface-muted border border-surface-border mt-3">
              <span className="w-10 h-10 flex items-center justify-center rounded-card bg-white text-brand-700">
                <CalendarIcon width={20} height={20} />
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-brand-900">
                  {selectedDate
                    ? formatDateLabel(selectedDate, referenceDate)
                    : "Chưa chọn ngày"}
                </strong>
                <p className="text-xs text-gray-400 mt-0.5">
                  Giá cuối tuần có thể chênh nhẹ cho combo hot.
                </p>
              </div>
              <span className="flex-shrink-0 px-2.5 py-1 rounded-chip bg-accent-rose-light text-accent-rose text-xs font-bold">
                {selectedDate ? getWeekendLabel(selectedDate) : "Trong tuần"}
              </span>
            </div>

            {/* Date pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
              {availableDates.map((date) => (
                <button
                  key={date}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-chip text-sm font-semibold transition-all active:scale-95 ${
                    selectedDate === date
                      ? "bg-brand-700 text-white shadow-button"
                      : "bg-white text-gray-600 border border-gray-200 shadow-card"
                  }`}
                  onClick={() => chooseDate(date)}
                  type="button"
                >
                  {formatDateLabel(date, referenceDate)}
                </button>
              ))}
            </div>

            {/* Availability hint */}
            <div className="flex items-start gap-2 mt-3 text-brand-600">
              <LightbulbIcon
                width={18}
                height={18}
                className="flex-shrink-0 mt-0.5"
              />
              <span className="text-sm font-semibold leading-snug">
                {nextDate
                  ? formatAvailabilityHint(nextDateSlots.length)
                  : "Chọn giờ trống trong ngày để chốt lịch nhanh hơn."}
              </span>
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {slotsForSelectedDate.map((slot) => (
                <TimeSlotButton
                  key={`${slot.date}-${slot.time}`}
                  time={slot.time}
                  selected={selectedTime === slot.time}
                  disabled={!slot.isAvailable}
                  onClick={() => chooseTime(slot.time)}
                />
              ))}
            </div>
          </BookingStep>

          {/* Step 3: Chọn dịch vụ */}
          <BookingStep
            number={3}
            title="Chọn dịch vụ"
            status={
              servicesDone ? "complete" : scheduleDone ? "active" : "pending"
            }
          >
            {/* Hint */}
            <div className="flex items-start gap-2 mb-3 text-brand-600">
              <LightbulbIcon
                width={18}
                height={18}
                className="flex-shrink-0 mt-0.5"
              />
              <span className="text-sm font-semibold leading-snug">
                Giá dịch vụ có thể thay đổi nhẹ theo khung giờ và stylist anh chọn.
              </span>
            </div>

            <Link
              className="flex items-center gap-3 p-3.5 rounded-card bg-surface-muted border border-surface-border shadow-card hover:shadow-card-hover transition-shadow"
              to="/services"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-card bg-white text-brand-700">
                <ScissorsIcon width={20} height={20} />
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-brand-900">
                  {selectedServices.length
                    ? `Đã chọn ${selectedServices.length} dịch vụ`
                    : needsConsultation
                    ? "Cần tư vấn tại salon"
                    : "Xem tất cả dịch vụ hấp dẫn"}
                </strong>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {selectedServices.length
                    ? "Có thể thay đổi ở màn hình dịch vụ trước khi chốt lịch."
                    : "Combo, nail art, pedicure và spa thư giãn."}
                </p>
              </div>
              <ChevronRightIcon
                width={16}
                height={16}
                className="text-gray-300 flex-shrink-0"
              />
            </Link>

            {/* Service summary */}
            {selectedServices.length ? (
              <div className="space-y-2 mt-3">
                {selectedServices.map((service) => (
                  <div
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-card bg-white border border-surface-border"
                    key={service.id}
                  >
                    <span className="text-sm text-brand-900 truncate">
                      {service.name}
                    </span>
                    <strong className="text-sm font-bold text-brand-700 flex-shrink-0">
                      {formatCurrency(service.price)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Consultation note */}
            {needsConsultation && !selectedServices.length ? (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-card bg-brand-50 text-brand-700">
                <UserIcon
                  width={16}
                  height={16}
                  className="flex-shrink-0 mt-0.5"
                />
                <span className="text-sm font-semibold">
                  Nhân viên sẽ giúp anh chọn dịch vụ phù hợp khi đến salon.
                </span>
              </div>
            ) : null}

            {/* Total */}
            <div className="flex items-center justify-between gap-3 mt-3 px-1 text-accent-green">
              <span className="text-sm font-semibold">
                Tổng số tiền anh cần thanh toán
              </span>
              <strong className="text-base font-bold">
                {formatCurrency(selectedTotal)}
              </strong>
            </div>
          </BookingStep>
        </div>

        {/* Error */}
        {submissionError ? (
          <p className="text-center text-sm font-semibold text-accent-rose mt-2 mb-2">
            {submissionError}
          </p>
        ) : null}

        {/* Submit CTA */}
        <button
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-button text-base font-bold transition-all active:scale-[0.98] mt-2 ${
            canCheckout && !submitting
              ? "bg-brand-700 text-white shadow-button hover:bg-brand-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          disabled={!canCheckout || submitting}
          onClick={() => {
            void submitBooking();
          }}
          type="button"
        >
          {submitting ? "Đang giữ chỗ..." : "Xác nhận lịch"}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Cắt xong trả tiền, huỷ lịch không sao.
        </p>
      </main>
    </MobileShell>
  );
}
