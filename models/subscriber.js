import Joi from "joi";

const subscriberSchema = Joi.object({
  userId: Joi.number()
    .integer()
    .required()
    .messages({
      "number.base": "Le champ 'userId' doit être un nombre.",
      "number.empty": "Le champ 'userId' est obligatoire.",
    }),

  creatorId: Joi.number()
    .integer()
    .required()
    .messages({
      "number.base": "Le champ 'creatorId' doit être un nombre.",
      "number.empty": "Le champ 'creatorId' est obligatoire.",
    }),

  hasAccess: Joi.boolean()
    .default(false)
    .messages({
      "boolean.base": "Le champ 'hasAccess' doit être une valeur booléenne.",
    }),
});

export default subscriberSchema;
