import type { TourStatus } from "./tour-status";

export interface Province {
  id: number;
  name: string;
  nameEn: string;
  nameVi: string;
  region: string;
}

export interface Salon {
  id: number;
  provinceId: number;
  provinceName: string;
  name: string;
  nameEn: string;
  nameVi: string;
  district: string;
  city: string;
  street: string;
  shortAddress: string;
  note: string;
  noteEn: string;
  noteVi: string;
  travelMinutes: number;
  distanceKm: number;
  nearby: boolean;
  parking: boolean;
  premium: boolean;
  heroTone: string;
  gallery: string[];
}

export interface Stylist {
  id: number;
  salonId: number;
  name: string;
  title: string;
  titleEn: string;
  titleVi: string;
  specialty: string;
  specialtyEn: string;
  specialtyVi: string;
  accent: string;
}

export interface ServiceCategory {
  id: number;
  slug: string;
  name: string;
  nameEn: string;
  nameVi: string;
  teaser: string;
  teaserEn: string;
  teaserVi: string;
}

export interface Service {
  id: number;
  categoryId: number;
  name: string;
  nameEn: string;
  nameVi: string;
  description: string;
  descriptionEn: string;
  descriptionVi: string;
  image?: string;
  durationMinutes: number;
  /** Price in USD cents (e.g. 3000 = $30.00) */
  price: number;
  badge: string | null;
  badgeEn: string | null;
  badgeVi: string | null;
  accent: string;
  tagline: string;
  taglineEn: string;
  taglineVi: string;
}

export interface TimeSlot {
  id: number;
  salonId: number;
  date: string;
  time: string;
  isPeak: boolean;
  isAvailable: boolean;
}

export interface BootstrapData {
  generatedAt: string;
  provinces: Province[];
  salons: Salon[];
  stylists: Stylist[];
  categories: ServiceCategory[];
  services: Service[];
  timeSlots: TimeSlot[];
}

export type PaymentMethod = "card" | "cash" | "digital_wallet";

export interface BookingPayload {
  salonId: number;
  stylistId: number;
  appointmentDate: string;
  appointmentTime: string;
  serviceIds: number[];
  needsConsultation: boolean;
  customerName?: string;
  paymentMethod: PaymentMethod;
  tipAmount: number;
}

export interface BookingConfirmation {
  bookingId: number;
  totalAmount: number;
  confirmationCode: string;
}

export interface BookingStatusEntry {
  id: number;
  bookingId: number;
  status: TourStatus;
  changedAt: string;
}

export interface Feedback {
  id: number;
  bookingId: number;
  rating: number;
  comment: string;
  createdAt: string;
}
