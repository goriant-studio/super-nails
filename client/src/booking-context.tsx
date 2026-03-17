/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { fetchSlots, submitBookingRequest } from "./api";
import { calculateTax, TAX_RATE } from "./tax-utils";
import type {
  BookingPayload,
  BootstrapData,
  PaymentMethod,
  Salon,
  Service,
  Stylist,
  TimeSlot
} from "./types";

const STORAGE_KEY = "super-nails-booking";

/** Client-only snapshot captured at submission time so the banner survives data refresh. */
export interface ConfirmedBooking {
  bookingId: number;
  confirmationCode: string;
  totalAmount: number;
  salonName: string;
  stylistName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceNames: string[];
  needsConsultation: boolean;
  paymentMethod: PaymentMethod;
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
}

interface StoredBookingState {
  selectedSalonId: number | null;
  selectedStylistId: number | null;
  selectedDate: string;
  selectedTime: string | null;
  selectedServiceIds: number[];
  needsConsultation: boolean;
  paymentMethod: PaymentMethod;
  tipPercent: number | null;
  tipCustomAmount: number | null;
}

interface BookingProviderProps {
  children: ReactNode;
  data: BootstrapData;
  refreshData: () => Promise<void>;
}

interface BookingContextValue {
  data: BootstrapData;
  selectedSalon: Salon | null;
  selectedStylist: Stylist | null;
  selectedDate: string;
  selectedTime: string | null;
  selectedServices: Service[];
  selectedServiceIds: number[];
  availableStylists: Stylist[];
  availableDates: string[];
  slotsForSelectedDate: TimeSlot[];
  slotsLoading: boolean;
  needsConsultation: boolean;
  submitting: boolean;
  submissionError: string | null;
  confirmation: ConfirmedBooking | null;
  chooseSalon: (salonId: number) => void;
  chooseStylist: (stylistId: number) => void;
  chooseDate: (date: string) => void;
  chooseTime: (time: string) => void;
  toggleService: (serviceId: number) => void;
  toggleConsultation: () => void;
  clearConfirmation: () => void;
  resetBooking: () => void;
  // Payment
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  // Pricing breakdown
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  grandTotal: number;
  // Tips
  tipPercent: number | null;
  tipCustomAmount: number | null;
  setTipPercent: (percent: number | null) => void;
  setTipCustom: (amount: number | null) => void;
  // Legacy compat
  selectedTotal: number;
  canCheckout: boolean;
  submitBooking: () => Promise<void>;
}

const BookingContext = createContext<BookingContextValue | null>(null);

function readStoredBookingState(): StoredBookingState | null {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return null;
    return JSON.parse(storedValue) as StoredBookingState;
  } catch {
    return null;
  }
}

function getInitialSalonId(data: BootstrapData, stored: StoredBookingState | null) {
  if (stored?.selectedSalonId && data.salons.some((salon) => salon.id === stored.selectedSalonId)) {
    return stored.selectedSalonId;
  }
  return data.salons[0]?.id ?? null;
}

/** Generate next 6 available dates from today (VN time, Asia/Ho_Chi_Minh). */
function getNextSixDates(): string[] {
  const dates: string[] = [];
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = formatter.format(new Date()); // YYYY-MM-DD in VN time
  const todayMs = new Date(todayStr + "T00:00:00").getTime();
  for (let i = 0; i < 6; i++) {
    const d = new Date(todayMs + i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function BookingProvider({
  children,
  data,
  refreshData
}: BookingProviderProps) {
  // #15: Only read localStorage once via useMemo
  const stored = useMemo(() => readStoredBookingState(), []);
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(() =>
    getInitialSalonId(data, stored)
  );
  const [selectedStylistId, setSelectedStylistId] = useState<number | null>(
    stored?.selectedStylistId ?? null
  );
  const [selectedDate, setSelectedDate] = useState<string>(stored?.selectedDate ?? "");
  const [selectedTime, setSelectedTime] = useState<string | null>(
    stored?.selectedTime ?? null
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(
    stored?.selectedServiceIds ?? []
  );
  const [needsConsultation, setNeedsConsultation] = useState<boolean>(
    stored?.needsConsultation ?? false
  );
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmedBooking | null>(null);
  const [slotsForSelectedDate, setSlotsForSelectedDate] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    stored?.paymentMethod ?? "card"
  );

  // Tips
  const [tipPercent, setTipPercent] = useState<number | null>(
    stored?.tipPercent ?? 18
  );
  const [tipCustomAmount, setTipCustomAmount] = useState<number | null>(
    stored?.tipCustomAmount ?? null
  );

  const selectedSalon =
    data.salons.find((salon) => salon.id === selectedSalonId) ?? null;
  const availableStylists = data.stylists.filter(
    (stylist) => stylist.salonId === selectedSalonId
  );
  const availableDates = useMemo(
    () => (selectedSalonId ? getNextSixDates() : []),
    [selectedSalonId]
  );
  const selectedStylist =
    availableStylists.find((stylist) => stylist.id === selectedStylistId) ?? null;
  const selectedServices = data.services.filter((service) =>
    selectedServiceIds.includes(service.id)
  );

  // Pricing breakdown (all in cents)
  const subtotal = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0
  );
  const taxAmount = calculateTax(subtotal, TAX_RATE);
  const tipAmount =
    tipCustomAmount !== null
      ? tipCustomAmount
      : tipPercent !== null
        ? Math.round(subtotal * (tipPercent / 100))
        : 0;
  const grandTotal = subtotal + taxAmount + tipAmount;
  const selectedTotal = grandTotal; // legacy compat

  useEffect(() => {
    if (!selectedSalonId && data.salons[0]) {
      setSelectedSalonId(data.salons[0].id);
    }
  }, [data.salons, selectedSalonId]);

  useEffect(() => {
    if (availableStylists.length === 0) {
      setSelectedStylistId(null);
      return;
    }
    const stylistStillValid = availableStylists.some(
      (stylist) => stylist.id === selectedStylistId
    );
    if (!stylistStillValid) {
      setSelectedStylistId(availableStylists[0].id);
    }
  }, [availableStylists, selectedStylistId]);

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDate("");
      return;
    }
    if (!selectedDate || !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  useEffect(() => {
    if (!selectedTime) return;
    const matchingSlot = slotsForSelectedDate.find((slot) => slot.time === selectedTime);
    if (!matchingSlot || !matchingSlot.isAvailable) {
      setSelectedTime(null);
    }
  }, [selectedTime, slotsForSelectedDate]);

  // Fetch slots whenever salon or date changes
  useEffect(() => {
    if (!selectedSalonId || !selectedDate) {
      setSlotsForSelectedDate([]);
      return;
    }
    setSlotsLoading(true);
    fetchSlots(selectedSalonId, selectedDate)
      .then(setSlotsForSelectedDate)
      .catch(() => setSlotsForSelectedDate([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedSalonId, selectedDate]);

  // Persist state
  useEffect(() => {
    const payload: StoredBookingState = {
      selectedSalonId,
      selectedStylistId,
      selectedDate,
      selectedTime,
      selectedServiceIds,
      needsConsultation,
      paymentMethod,
      tipPercent,
      tipCustomAmount,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    needsConsultation,
    selectedDate,
    selectedSalonId,
    selectedServiceIds,
    selectedStylistId,
    selectedTime,
    paymentMethod,
    tipPercent,
    tipCustomAmount,
  ]);

  function resetNotices() {
    setSubmissionError(null);
    setConfirmation(null);
  }

  function chooseSalon(salonId: number) {
    setSelectedSalonId(salonId);
    setSelectedTime(null);
    resetNotices();
  }

  function chooseStylist(stylistId: number) {
    setSelectedStylistId(stylistId);
    resetNotices();
  }

  function chooseDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    resetNotices();
  }

  function chooseTime(time: string) {
    setSelectedTime(time);
    resetNotices();
  }

  function toggleService(serviceId: number) {
    setSelectedServiceIds((currentIds) =>
      currentIds.includes(serviceId)
        ? currentIds.filter((currentId) => currentId !== serviceId)
        : [...currentIds, serviceId]
    );
    resetNotices();
  }

  function toggleConsultation() {
    setNeedsConsultation((currentValue) => !currentValue);
    resetNotices();
  }

  function clearConfirmation() {
    setConfirmation(null);
  }

  function resetBooking() {
    setSelectedServiceIds([]);
    setNeedsConsultation(false);
    setSelectedTime(null);
    setTipPercent(18);
    setTipCustomAmount(null);
    setPaymentMethod("card");
    setConfirmation(null);
    setSubmissionError(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const canCheckout = Boolean(
    selectedSalon && selectedStylist && selectedDate && selectedTime && (selectedServiceIds.length > 0 || needsConsultation)
  );

  async function submitBooking() {
    if (!selectedSalon || !selectedStylist || !selectedDate || !selectedTime) {
      setSubmissionError("Please select a salon, stylist, date, and time.");
      return;
    }

    if (!selectedServiceIds.length && !needsConsultation) {
      setSubmissionError("Select at least one service or request a consultation.");
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const payload: BookingPayload = {
        salonId: selectedSalon.id,
        stylistId: selectedStylist.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        serviceIds: selectedServiceIds,
        needsConsultation,
        paymentMethod,
        tipAmount,
      };

      // Capture snapshot from current state BEFORE refreshData() clears availability
      const snapshotSalonName = selectedSalon.name;
      const snapshotStylistName = selectedStylist.name;
      const snapshotDate = selectedDate;
      const snapshotTime = selectedTime;
      const snapshotServiceNames = selectedServices.map((s) => s.name);
      const snapshotConsultation = needsConsultation;

      const apiResult = await submitBookingRequest(payload);
      await refreshData();

      setConfirmation({
        bookingId: apiResult.bookingId,
        confirmationCode: apiResult.confirmationCode,
        totalAmount: grandTotal,
        salonName: snapshotSalonName,
        stylistName: snapshotStylistName,
        appointmentDate: snapshotDate,
        appointmentTime: snapshotTime,
        serviceNames: snapshotServiceNames,
        needsConsultation: snapshotConsultation,
        paymentMethod,
        subtotal,
        taxAmount,
        tipAmount,
      });
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Unable to book at this time."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BookingContext.Provider
      value={{
        data,
        selectedSalon,
        selectedStylist,
        selectedDate,
        selectedTime,
        selectedServices,
        selectedServiceIds,
        availableStylists,
        availableDates,
        slotsForSelectedDate,
        slotsLoading,
        needsConsultation,
        submitting,
        submissionError,
        confirmation,
        chooseSalon,
        chooseStylist,
        chooseDate,
        chooseTime,
        toggleService,
        toggleConsultation,
        clearConfirmation,
        resetBooking,
        paymentMethod,
        setPaymentMethod,
        subtotal,
        taxAmount,
        tipAmount,
        grandTotal,
        tipPercent,
        tipCustomAmount,
        setTipPercent,
        setTipCustom: setTipCustomAmount,
        selectedTotal,
        canCheckout,
        submitBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);

  if (!context) {
    throw new Error("useBooking must be used inside BookingProvider.");
  }

  return context;
}
