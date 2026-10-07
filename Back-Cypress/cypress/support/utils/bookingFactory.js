const uniqueSuffix = () => Math.random().toString(36).slice(2, 8);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Gera um payload de reserva válido e único (nomes exclusivos permitem filtrar pela reserva criada). */
export function buildBooking(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    firstname: `Ana${suffix}`,
    lastname: `Silva${suffix}`,
    totalprice: randomInt(100, 999),
    depositpaid: true,
    bookingdates: { checkin: "2026-11-01", checkout: "2026-11-05" },
    additionalneeds: "Breakfast",
    ...overrides,
  };
}

/** Remove um campo do payload (suporta caminho aninhado, ex.: "bookingdates.checkin"). */
export function withoutField(payload, fieldPath) {
  const copy = structuredClone(payload);
  const keys = fieldPath.split(".");
  const last = keys.pop();
  const parent = keys.reduce((obj, key) => obj[key], copy);
  delete parent[last];
  return copy;
}

/** Soma (ou subtrai) dias de uma data no formato YYYY-MM-DD. */
export function shiftDate(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
