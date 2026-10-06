import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });

export function validateSchema(schema, data) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: ajv.errorsText(validate.errors) };
}
