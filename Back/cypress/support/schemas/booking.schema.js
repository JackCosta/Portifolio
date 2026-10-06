const isoDate = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };

export const bookingSchema = {
  type: "object",
  required: ["firstname", "lastname", "totalprice", "depositpaid", "bookingdates"],
  additionalProperties: false,
  properties: {
    firstname: { type: "string" },
    lastname: { type: "string" },
    totalprice: { type: "number" },
    depositpaid: { type: "boolean" },
    bookingdates: {
      type: "object",
      required: ["checkin", "checkout"],
      additionalProperties: false,
      properties: { checkin: isoDate, checkout: isoDate },
    },
    additionalneeds: { type: "string" },
  },
};

export const createdBookingSchema = {
  type: "object",
  required: ["bookingid", "booking"],
  additionalProperties: false,
  properties: {
    bookingid: { type: "integer", minimum: 1 },
    booking: bookingSchema,
  },
};

export const bookingListSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["bookingid"],
    additionalProperties: false,
    properties: { bookingid: { type: "integer", minimum: 1 } },
  },
};
