/**
 * Odometer formatting. The dataset is metric throughout, so no unit conversion —
 * just consistent grouping and an explicit unit so a reading is never ambiguous.
 */
const km = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 });

/** 47731 -> "47,731 km" */
export function formatOdometer(odometerKm: number): string {
  return `${km.format(odometerKm)} km`;
}
