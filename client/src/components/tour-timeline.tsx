import { useT } from "../i18n/i18n-context";
import { isStatusReached, type TourStatus } from "../tour-status";

interface TourTimelineProps {
  currentStatus: TourStatus;
}

const STATUS_ICONS: Record<TourStatus, string> = {
  booked: "📋",
  confirmed: "✅",
  in_progress: "💅",
  completed: "🎉",
  feedback_pending: "⭐",
  feedback_done: "💬",
  shared: "📤",
};

const STATUS_KEYS: Record<TourStatus, string> = {
  booked: "tour.status_booked",
  confirmed: "tour.status_confirmed",
  in_progress: "tour.status_in_progress",
  completed: "tour.status_completed",
  feedback_pending: "tour.status_feedback",
  feedback_done: "tour.status_feedback",
  shared: "tour.status_shared",
};

export function TourTimeline({ currentStatus }: TourTimelineProps) {
  const t = useT();

  // Show simplified steps (don't show feedback_pending/feedback_done separately)
  const displaySteps: TourStatus[] = [
    "booked",
    "confirmed",
    "in_progress",
    "completed",
    "feedback_done",
    "shared",
  ];

  return (
    <div className="relative pl-8">
      {displaySteps.map((status, index) => {
        const reached = isStatusReached(currentStatus, status);
        const isCurrent = status === currentStatus || 
          (status === "feedback_done" && currentStatus === "feedback_pending");
        const isLast = index === displaySteps.length - 1;

        return (
          <div key={status} className="relative pb-8 last:pb-0">
            {/* Connecting line */}
            {!isLast && (
              <div
                className={`absolute left-[-20px] top-8 w-0.5 h-full ${
                  reached ? "bg-brand-400" : "bg-gray-200"
                }`}
              />
            )}

            {/* Status dot */}
            <div
              className={`absolute left-[-28px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] transition-all ${
                isCurrent
                  ? "border-brand-600 bg-brand-600 text-white scale-125 shadow-md"
                  : reached
                    ? "border-brand-500 bg-brand-100 text-brand-600"
                    : "border-gray-300 bg-white text-gray-400"
              }`}
            >
              {reached ? "✓" : ""}
            </div>

            {/* Content */}
            <div
              className={`transition-opacity ${
                reached ? "opacity-100" : "opacity-40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{STATUS_ICONS[status]}</span>
                <span
                  className={`font-semibold text-sm ${
                    isCurrent ? "text-brand-700" : "text-gray-700"
                  }`}
                >
                  {t(STATUS_KEYS[status])}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
