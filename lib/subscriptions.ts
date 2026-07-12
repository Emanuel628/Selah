export const SELAH_PRO_MONTHLY_PRODUCT_ID =
  process.env.EXPO_PUBLIC_SELAH_PRO_MONTHLY_PRODUCT_ID ||
  process.env.EXPO_PUBLIC_SELAH_PRO_PRODUCT_ID ||
  "selah_pro_monthly";

export const SELAH_PRO_YEARLY_PRODUCT_ID =
  process.env.EXPO_PUBLIC_SELAH_PRO_YEARLY_PRODUCT_ID || "selah_pro_yearly";

export const SELAH_PRO_PRODUCT_IDS = [
  SELAH_PRO_MONTHLY_PRODUCT_ID,
  SELAH_PRO_YEARLY_PRODUCT_ID,
];

export const SUBSCRIPTION_FALLBACKS = {
  [SELAH_PRO_MONTHLY_PRODUCT_ID]: {
    title: "Selah Pro Monthly",
    price: "$1.99 / month",
    cadence: "Renews monthly.",
    cta: "Start Monthly",
  },
  [SELAH_PRO_YEARLY_PRODUCT_ID]: {
    title: "Selah Pro Yearly",
    price: "$14.99 / year",
    cadence: "Renews yearly.",
    cta: "Start Yearly",
  },
};
