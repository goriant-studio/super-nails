export type TourStatus =
  | "booked"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "feedback_pending"
  | "feedback_done"
  | "shared";

export const TOUR_STATUS_ORDER: TourStatus[] = [
  "booked",
  "confirmed",
  "in_progress",
  "completed",
  "feedback_pending",
  "feedback_done",
  "shared",
];

const VALID_TRANSITIONS: Record<TourStatus, TourStatus[]> = {
  booked: ["confirmed"],
  confirmed: ["in_progress"],
  in_progress: ["completed"],
  completed: ["feedback_pending"],
  feedback_pending: ["feedback_done"],
  feedback_done: ["shared"],
  shared: [],
};

export function canTransition(
  from: TourStatus,
  to: TourStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getStatusIndex(status: TourStatus): number {
  return TOUR_STATUS_ORDER.indexOf(status);
}

export function isStatusReached(
  current: TourStatus,
  check: TourStatus
): boolean {
  return getStatusIndex(current) >= getStatusIndex(check);
}
