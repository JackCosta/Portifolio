export const authSuccessSchema = {
  type: "object",
  required: ["token"],
  additionalProperties: false,
  properties: {
    token: { type: "string", pattern: "^[a-f0-9]{15}$" },
  },
};

export const authFailureSchema = {
  type: "object",
  required: ["reason"],
  additionalProperties: false,
  properties: {
    reason: { type: "string", const: "Bad credentials" },
  },
};
