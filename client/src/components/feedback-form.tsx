import { useState } from "react";
import { useT } from "../i18n/i18n-context";

interface FeedbackFormProps {
  onSubmit: (rating: number, comment: string) => void;
  submitting?: boolean;
}

export function FeedbackForm({ onSubmit, submitting }: FeedbackFormProps) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit(rating, comment);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="font-heading text-lg font-bold text-brand-900">
        {t("tour.feedback_title")}
      </h3>

      {/* Star rating */}
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className={`text-4xl transition-transform ${
              star <= (hoveredStar || rating)
                ? "scale-110"
                : "scale-100 opacity-30"
            }`}
            style={{
              filter:
                star <= (hoveredStar || rating)
                  ? "none"
                  : "grayscale(1)",
            }}
          >
            ⭐
          </button>
        ))}
      </div>

      {rating > 0 && (
        <p className="text-center text-sm text-gray-500">
          {rating}/5
        </p>
      )}

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("tour.feedback_comment")}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm resize-none focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={rating === 0 || submitting}
        className="w-full py-3.5 rounded-xl bg-brand-700 text-white font-bold text-sm shadow-button hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "..." : t("tour.feedback_submit")}
      </button>
    </form>
  );
}
