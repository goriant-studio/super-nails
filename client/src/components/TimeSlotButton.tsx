interface TimeSlotButtonProps {
  time: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function TimeSlotButton({
  time,
  selected,
  disabled,
  onClick,
}: TimeSlotButtonProps) {
  return (
    <button
      className={`py-3 px-2 rounded-button text-sm font-bold transition-all active:scale-95 ${
        selected
          ? "bg-brand-700 text-white shadow-button"
          : disabled
          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
          : "bg-white text-brand-900 border-2 border-gray-200 hover:border-brand-400"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {time.replace(":", "h")}
    </button>
  );
}
