import Joi from "joi";

const creatorSchema = Joi.object({
  userId: Joi.number()
    .integer()
    .required()
    .messages({
      "number.base": "Le champ 'userId' doit être un nombre.",
      "number.empty": "Le champ 'userId' est obligatoire.",
    }),

  isPublic: Joi.boolean()
    .default(false)
    .messages({
      "boolean.base": "Le champ 'isPublic' doit être une valeur booléenne.",
    }),
});

export default creatorSchema;
