import { useState } from "react";
import { useBooking } from "../booking-context";
import { formatCurrency } from "../formatters";
import { useT } from "../i18n/i18n-context";

const PRESETS = [
  { label: "15%", value: 15 },
  { label: "18%", value: 18 },
  { label: "20%", value: 20 },
  { label: "25%", value: 25 },
];

export function TipSelector() {
  const { subtotal, tipPercent, tipCustomAmount, tipAmount, setTipPercent, setTipCustom } =
    useBooking();
  const t = useT();
  const [showCustom, setShowCustom] = useState(tipCustomAmount !== null);

  function handlePreset(percent: number) {
    setShowCustom(false);
    setTipCustom(null);
    setTipPercent(percent);
  }

  function handleNoTip() {
    setShowCustom(false);
    setTipCustom(null);
    setTipPercent(null);
  }

  function handleCustomToggle() {
    setShowCustom(true);
    setTipPercent(null);
    setTipCustom(0);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setTipCustom(isNaN(val) ? 0 : Math.round(val * 100)); // convert dollars to cents
  }

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-lg font-bold text-brand-900">
        {t("tip.title")}
      </h3>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => handlePreset(value)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tipPercent === value && !showCustom
                ? "bg-brand-700 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
            {subtotal > 0 && (
              <span className="block text-xs opacity-75 mt-0.5">
                {formatCurrency(Math.round(subtotal * (value / 100)))}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustomToggle}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            showCustom
              ? "bg-brand-700 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("tip.custom")}
        </button>
        <button
          type="button"
          onClick={handleNoTip}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tipPercent === null && !showCustom
              ? "bg-gray-700 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("tip.no_tip")}
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-bold">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue={
              tipCustomAmount !== null ? (tipCustomAmount / 100).toFixed(2) : ""
            }
            onChange={handleCustomChange}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 font-mono"
          />
        </div>
      )}

      {tipAmount > 0 && (
        <p className="text-sm text-gray-500">
          {t("summary.tip")}: {formatCurrency(tipAmount)}
        </p>
      )}
    </div>
  );
}
