const AppModel = require("../db/models/appModel");
const { buildTypes } = require("../utils/constants");
const { bucket } = require("../utils/firebase");

// Shared helper functions
const versionToNumber = (version) => {
    const numbers = version.split(".").map(Number);
    while (numbers.length < 3) numbers.push(0);
    return numbers;
};

const generateSignedUrl = async (urlPath) => {
    if (!urlPath) throw new Error("URL path is required");

    const [url] = await bucket.file(urlPath).getSignedUrl({
        action: "read",
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    });
    return url;
};

const validateVersion = (version) => {
    const versionRegex = /^\d+(\.\d+)*$/;
    return typeof version === "string" && versionRegex.test(version);
};

const checkupdates = async (req, res) => {
    try {
        const { app_version, build_type } = req.query;

        // Input validation
        if (!app_version) {
            return res.status(400).json({
                status: false,
                message: "App version is required.",
            });
        }

        if (!validateVersion(app_version)) {
            return res.status(400).json({
                status: false,
                message: "Invalid version format. Use X.Y.Z format with numbers only.",
            });
        }

        const providedVersion = versionToNumber(app_version);

        // Build query object
        const query = {
            app_version: { $exists: true },
            build_type: build_type || "PRODUCTION",
        };

        // Find all matching versions, sorted by `app_version` in descending order
        const allVersions = await AppModel.find(query)
            .sort({ app_version: -1 })
            .lean();

        if (!allVersions.length) {
            return res.status(404).json({
                status: false,
                message: "No updates available",
            });
        }

        const latestVersion = allVersions[0];
        const latestVersionNumber = versionToNumber(latestVersion.app_version);

        // Compare provided version with the latest version
        const isUpdateAvailable = latestVersionNumber.some(
            (num, idx) => num > (providedVersion[idx] || 0)
        );

        if (isUpdateAvailable) {
            const url = await generateSignedUrl(latestVersion.url_path);

            return res.status(200).json({
                status: true,
                message: `A newer version is available.\n\nAPP_VERSION: ${latestVersion.app_version}`,
                data: {
                    type: latestVersion.type,
                    version: latestVersion.app_version,
                    current_version: app_version,
                    url,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                },
            });
        }

        return res.status(200).json({
            status: false,
            message: `You are using the latest version.\n\nAPP_VERSION: ${app_version}`,
        });
    } catch (error) {
        console.error("Version check error:", error);
        return res.status(500).json({
            status: false,
            message:
                error.message || "Something went wrong during the version check.",
        });
    }
};

const getApp = async (req, res) => {
    try {
        const { app_version, build_type } = req.query;

        if (!app_version) {
            return res.status(400).json({
                status: false,
                message: "App version is required",
            });
        }

        if (!validateVersion(app_version)) {
            return res.status(400).json({
                status: false,
                message: "Invalid version format",
            });
        }

        const query = { app_version };
        if (build_type) {
            if (!Object.values(buildTypes).includes(build_type)) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid build type",
                });
            }
            query.build_type = build_type;
        }

        const appVersionData = await AppModel.findOne(query).lean();

        if (!appVersionData) {
            return res.status(404).json({
                status: false,
                message: "No updates available",
            });
        }

        const url = await generateSignedUrl(appVersionData.url_path);

        return res.status(200).json({
            status: true,
            data: {
                url,
                version: appVersionData.app_version,
                type: appVersionData.type,
                build_type: appVersionData.build_type,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
        });
    } catch (error) {
        console.error("Get app error:", error);
        return res.status(500).json({
            status: false,
            message: error.message || "Something went wrong",
        });
    }
};

const addNewApp = async (req, res) => {
    try {
        const { name, type, app_version, url_path, build_type } = req.body;

        // Validate required fields
        if (!app_version || !url_path) {
            return res.status(400).json({
                status: false,
                message: "App version and URL path are required",
            });
        }

        if (!validateVersion(app_version)) {
            return res.status(400).json({
                status: false,
                message: "Invalid version format",
            });
        }

        // Check if version already exists
        const existingApp = await AppModel.findOne({ app_version }).lean();
        if (existingApp) {
            return res.status(409).json({
                status: false,
                message: "This version already exists",
            });
        }

        const newApp = new AppModel({
            name: name || "hydroponics",
            build_type: build_type || "PRODUCTION",
            status: true,
            type: type || "NORMAL",
            app_version,
            url_path,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await newApp.save();

        return res.status(201).json({
            status: true,
            message: "New application version added successfully",
            data: {
                version: app_version,
                type,
                build_type,
            },
        });
    } catch (error) {
        console.error("Add new app error:", error);
        return res.status(500).json({
            status: false,
            message: error.message || "Something went wrong",
            errorDetails: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
};

module.exports = {
    checkupdates,
    getApp,
    addNewApp,
};
