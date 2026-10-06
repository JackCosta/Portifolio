import { After } from "@badeball/cypress-cucumber-preprocessor";
import bookingPage from "../../support/pages/BookingPage";
import { getAuthHeaders } from "../../support/utils/authHeaders";
import { createdBookings } from "../../support/utils/createdBookings";

// Remove as reservas criadas no cenário para não poluir a base compartilhada.
After(() => {
  const ids = createdBookings.splice(0);
  if (ids.length === 0) return;
  getAuthHeaders("basic").then((headers) => {
    ids.forEach((id) => bookingPage.delete(id, headers, { report: false }));
  });
});
