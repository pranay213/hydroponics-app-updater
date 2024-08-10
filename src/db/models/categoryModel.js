const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: Boolean,
      default: true,
      required: true,
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
module.exports = model("Category", categorySchema);
