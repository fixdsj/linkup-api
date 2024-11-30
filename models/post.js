import Joi from "joi";

const postSchema = Joi.object({
  creatorId: Joi.number()
    .integer()
    .required()
    .messages({
      "number.base": "Le champ 'creatorId' doit être un nombre.",
      "number.empty": "Le champ 'creatorId' est obligatoire.",
    }),

  type: Joi.string()
    .valid("text", "image", "video")
    .required()
    .messages({
      "string.empty": "Le champ 'type' est obligatoire.",
      "any.only": "Le champ 'type' doit être 'text', 'image' ou 'video'.",
    }),

  content: Joi.string()
    .max(1024)
    .allow(null, "")
    .messages({
      "string.max": "Le champ 'content' ne peut pas dépasser 1024 caractères.",
    }),

  blobUrl: Joi.string()
    .uri()
    .allow(null, "")
    .messages({
      "string.uri": "Le champ 'blobUrl' doit être une URL valide.",
    }),
});

export default postSchema;
