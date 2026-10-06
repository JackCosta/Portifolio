/** Converte um texto monetário ("$29.99", "Total: $43.18") em número. */
export const parsePrice = (text) => {
  const match = String(text).match(/\$(\d+(?:\.\d{1,2})?)/);
  if (!match) throw new Error(`Valor monetário não encontrado em "${text}"`);
  return Number(match[1]);
};

/** Soma valores monetários sem erro de ponto flutuante (trabalha em centavos). */
export const sumPrices = (prices) =>
  prices.reduce((total, price) => total + Math.round(price * 100), 0) / 100;
