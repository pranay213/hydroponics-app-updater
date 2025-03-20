const { Schema, model } = require("mongoose");

const appSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        build_type: {
            type: String,
            enum: ["DEVELOPMENT", "PRODUCTION", "STAGING"],
            required: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
        type: {
            type: String,
            enum: ["CRITICAL", "NORMAL", "PATCH", "MINOR", "MAJOR"],
            required: true,
        },
        app_version: {
            type: String,
            required: true,
        },
        url_path: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = model("App", appSchema);
