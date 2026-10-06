import { authFailureSchema, authSuccessSchema } from "./auth.schema";
import { bookingListSchema, bookingSchema, createdBookingSchema } from "./booking.schema";

/** Contratos referenciados pelo nome nos arquivos .feature. */
export const schemas = {
  "token gerado": authSuccessSchema,
  "falha de autenticação": authFailureSchema,
  reserva: bookingSchema,
  "reserva criada": createdBookingSchema,
  "lista de reservas": bookingListSchema,
};
