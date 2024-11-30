import Joi from "joi";

const userSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Le champ 'name' est obligatoire.",
      "string.min": "Le champ 'name' doit contenir au moins 3 caractères.",
      "string.max": "Le champ 'name' ne peut pas dépasser 50 caractères.",
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Le champ 'email' doit contenir une adresse email valide.",
      "string.empty": "Le champ 'email' est obligatoire.",
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
      "string.empty": "Le champ 'password' est obligatoire.",
      "string.min": "Le mot de passe doit contenir au moins 6 caractères.",
    }),
});

export default userSchema;
