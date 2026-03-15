import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import { submitBookingRequest } from "./api";
import type {
  BookingConfirmation,
  BookingPayload,
  BootstrapData,
  Salon,
  Service,
  Stylist,
  TimeSlot
} from "./types";

const STORAGE_KEY = "super-nails-booking";

interface StoredBookingState {
  selectedSalonId: number | null;
  selectedStylistId: number | null;
  selectedDate: string;
  selectedTime: string | null;
  selectedServiceIds: number[];
  needsConsultation: boolean;
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
  needsConsultation: boolean;
  submitting: boolean;
  submissionError: string | null;
  confirmation: BookingConfirmation | null;
  chooseSalon: (salonId: number) => void;
  chooseStylist: (stylistId: number) => void;
  chooseDate: (date: string) => void;
  chooseTime: (time: string) => void;
  toggleService: (serviceId: number) => void;
  toggleConsultation: () => void;
  clearConfirmation: () => void;
  selectedTotal: number;
  canCheckout: boolean;
  submitBooking: () => Promise<void>;
}

const BookingContext = createContext<BookingContextValue | null>(null);

function readStoredBookingState(): StoredBookingState | null {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    return JSON.parse(storedValue) as StoredBookingState;
  } catch (_error) {
    return null;
  }
}

function getInitialSalonId(data: BootstrapData, stored: StoredBookingState | null) {
  if (stored?.selectedSalonId && data.salons.some((salon) => salon.id === stored.selectedSalonId)) {
    return stored.selectedSalonId;
  }

  return data.salons[0]?.id ?? null;
}

function getSalonDates(data: BootstrapData, salonId: number | null) {
  if (!salonId) {
    return [];
  }

  return Array.from(
    new Set(
      data.timeSlots
        .filter((slot) => slot.salonId === salonId)
        .map((slot) => slot.date)
    )
  ).sort();
}

export function BookingProvider({
  children,
  data,
  refreshData
}: BookingProviderProps) {
  const stored = readStoredBookingState();
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
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const selectedSalon =
    data.salons.find((salon) => salon.id === selectedSalonId) ?? null;
  const availableStylists = data.stylists.filter(
    (stylist) => stylist.salonId === selectedSalonId
  );
  const availableDates = getSalonDates(data, selectedSalonId);
  const slotsForSelectedDate = data.timeSlots.filter(
    (slot) => slot.salonId === selectedSalonId && slot.date === selectedDate
  );
  const selectedStylist =
    availableStylists.find((stylist) => stylist.id === selectedStylistId) ?? null;
  const selectedServices = data.services.filter((service) =>
    selectedServiceIds.includes(service.id)
  );
  const selectedTotal = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0
  );

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
    if (!selectedTime) {
      return;
    }

    const matchingSlot = slotsForSelectedDate.find((slot) => slot.time === selectedTime);

    if (!matchingSlot || !matchingSlot.isAvailable) {
      setSelectedTime(null);
    }
  }, [selectedTime, slotsForSelectedDate]);

  useEffect(() => {
    const payload: StoredBookingState = {
      selectedSalonId,
      selectedStylistId,
      selectedDate,
      selectedTime,
      selectedServiceIds,
      needsConsultation
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    needsConsultation,
    selectedDate,
    selectedSalonId,
    selectedServiceIds,
    selectedStylistId,
    selectedTime
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

  const canCheckout = Boolean(
    selectedSalon && selectedStylist && selectedDate && selectedTime && (selectedServiceIds.length > 0 || needsConsultation)
  );

  async function submitBooking() {
    if (!selectedSalon || !selectedStylist || !selectedDate || !selectedTime) {
      setSubmissionError("Vui lòng chọn đầy đủ salon, stylist, ngày và giờ.");
      return;
    }

    if (!selectedServiceIds.length && !needsConsultation) {
      setSubmissionError("Chọn ít nhất một dịch vụ hoặc bật tư vấn tại salon.");
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
        needsConsultation
      };

      const nextConfirmation = await submitBookingRequest(payload);
      await refreshData();
      setConfirmation(nextConfirmation);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Không thể chốt lịch lúc này."
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
