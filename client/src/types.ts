export interface Province {
  id: number;
  name: string;
  region: string;
}

export interface Salon {
  id: number;
  provinceId: number;
  provinceName: string;
  name: string;
  district: string;
  city: string;
  street: string;
  shortAddress: string;
  note: string;
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
  specialty: string;
  accent: string;
}

export interface ServiceCategory {
  id: number;
  slug: string;
  name: string;
  teaser: string;
}

export interface Service {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  badge: string | null;
  accent: string;
  tagline: string;
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

export interface BookingPayload {
  salonId: number;
  stylistId: number;
  appointmentDate: string;
  appointmentTime: string;
  serviceIds: number[];
  needsConsultation: boolean;
  customerName?: string;
}

export interface BookingConfirmation {
  bookingId: number;
  totalAmount: number;
  confirmationCode: string;
}
