const requiredEnv = ["MONGO_URI", "JWT_SECRET"];

export const validateEnv = () => {
    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    if (process.env.JWT_SECRET === "your-secret-key") {
        throw new Error("JWT_SECRET must not use insecure default value");
    }
};
