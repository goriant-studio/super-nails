import { useBooking } from "../booking-context";
import { useT } from "../i18n/i18n-hooks";
import type { PaymentMethod } from "../types";

const METHODS: { key: PaymentMethod; icon: string }[] = [
  { key: "card", icon: "💳" },
  { key: "cash", icon: "💵" },
  { key: "digital_wallet", icon: "📱" },
];

export function PaymentSection() {
  const { paymentMethod, setPaymentMethod } = useBooking();
  const t = useT();

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-bold text-brand-900">
        {t("payment.title")}
      </h3>

      {/* Method selector */}
      <div className="grid grid-cols-3 gap-3">
        {METHODS.map(({ key, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPaymentMethod(key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              paymentMethod === key
                ? "border-brand-700 bg-brand-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="text-2xl">{icon}</span>
            <span
              className={`text-sm font-semibold ${
                paymentMethod === key ? "text-brand-700" : "text-gray-600"
              }`}
            >
              {t(`payment.${key === "digital_wallet" ? "digital_wallet" : key}`)}
            </span>
          </button>
        ))}
      </div>

      {/* Method details */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        {paymentMethod === "card" && <CardFields />}
        {paymentMethod === "cash" && (
          <p className="text-sm text-gray-600">{t("payment.cash_note")}</p>
        )}
        {paymentMethod === "digital_wallet" && (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">{t("payment.wallet_note")}</p>
            <button
              type="button"
              className="w-full py-3 bg-black text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-lg">🍎</span> Apple Pay
            </button>
            <button
              type="button"
              className="w-full py-3 bg-white border-2 border-gray-300 text-gray-800 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-lg">G</span> Google Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CardFields() {
  const t = useT();
  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder={t("payment.card_holder")}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
      <input
        type="text"
        inputMode="numeric"
        placeholder={t("payment.card_number")}
        maxLength={19}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 font-mono"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder={t("payment.card_expiry")}
          maxLength={5}
          className="px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 font-mono"
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder={t("payment.card_cvv")}
          maxLength={4}
          className="px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 font-mono"
        />
      </div>
    </div>
  );
}
