import { useState } from "react";
import { useT } from "../i18n/i18n-context";

interface SocialShareProps {
  salonName: string;
  rating: number;
  bookingId: number;
}

export function SocialShare({ salonName, rating, bookingId }: SocialShareProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const shareMessage = t("tour.share_message", {
    salon: salonName,
    rating: String(rating),
  });
  const shareUrl = `${window.location.origin}/tour/${bookingId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = `${shareMessage}\n${shareUrl}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Super Nails",
          text: shareMessage,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
      return;
    }
  }

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareMessage}\n${shareUrl}`)}`;

  const BUTTONS = [
    { label: t("tour.share_facebook"), url: facebookUrl, bg: "bg-[#1877F2]", icon: "📘" },
    { label: t("tour.share_twitter"), url: twitterUrl, bg: "bg-black", icon: "𝕏" },
    { label: t("tour.share_whatsapp"), url: whatsappUrl, bg: "bg-[#25D366]", icon: "💬" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-bold text-brand-900">
        {t("tour.share_title")}
      </h3>

      {/* Native share (if available) */}
      {typeof navigator.share === "function" && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="w-full py-3.5 rounded-xl bg-brand-700 text-white font-bold text-sm shadow-button hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          📤 Share
        </button>
      )}

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-2">
        {BUTTONS.map(({ label, url, bg, icon }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${bg} text-white py-3 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2 active:scale-95 transition-transform`}
          >
            <span>{icon}</span> {label}
          </a>
        ))}

        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopy}
          className="bg-gray-200 text-gray-800 py-3 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2 active:scale-95 transition-transform col-span-2"
        >
          {copied ? "✅" : "🔗"} {copied ? t("tour.share_copied") : t("tour.share_copy")}
        </button>
      </div>
    </div>
  );
}
