const { Schema, model } = require("mongoose");

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    user_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Brand", brandSchema);
