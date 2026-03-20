const PLACEHOLDER_VALUES = new Set([
    "",
    "your_app_password",
    "change-me",
    "replace-me",
    "example",
    "test",
]);

const hasInvalidSecretChars = (value) => /[`'"]/.test(String(value || ""));

export const getEnvReadinessReport = (env = process.env) => {
    const requiredKeys = ["MONGO_URI", "JWT_SECRET"];
    const optionalProviders = {
        payments: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
        email: ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"],
        messaging: ["TWILIO_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE"],
        whatsapp: ["TWILIO_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"],
    };

    const missingRequired = requiredKeys.filter((key) => !String(env[key] || "").trim());
    const placeholderValues = Object.entries(env)
        .filter(([key, value]) =>
            ["JWT_SECRET", "RAZORPAY_KEY_SECRET", "EMAIL_PASS"].includes(key) &&
            PLACEHOLDER_VALUES.has(String(value || "").trim().toLowerCase())
        )
        .map(([key]) => key);
    const malformedSecrets = ["JWT_SECRET", "RAZORPAY_KEY_SECRET"]
        .filter((key) => String(env[key] || "").trim())
        .filter((key) => hasInvalidSecretChars(env[key]));

    const providerStatus = Object.fromEntries(
        Object.entries(optionalProviders).map(([provider, keys]) => [
            provider,
            keys.every((key) => String(env[key] || "").trim()),
        ])
    );

    return {
        missingRequired,
        placeholderValues,
        malformedSecrets,
        providerStatus,
        ok:
            missingRequired.length === 0 &&
            placeholderValues.length === 0 &&
            malformedSecrets.length === 0,
    };
};

export const assertProductionEnv = (env = process.env) => {
    const report = getEnvReadinessReport(env);

    if (!report.ok) {
        const issues = [
            report.missingRequired.length
                ? `missing required env: ${report.missingRequired.join(", ")}`
                : "",
            report.placeholderValues.length
                ? `placeholder values: ${report.placeholderValues.join(", ")}`
                : "",
            report.malformedSecrets.length
                ? `malformed secrets: ${report.malformedSecrets.join(", ")}`
                : "",
        ].filter(Boolean);

        throw new Error(`Environment validation failed: ${issues.join(" | ")}`);
    }

    return report;
};
