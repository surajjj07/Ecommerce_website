import test from "node:test";
import assert from "node:assert/strict";
import { getEnvReadinessReport } from "../config/env.js";

test("flags placeholder email password and malformed razorpay secret", () => {
    const report = getEnvReadinessReport({
        MONGO_URI: "mongodb://example",
        JWT_SECRET: "super-secret",
        RAZORPAY_KEY_ID: "rzp_test_123",
        RAZORPAY_KEY_SECRET: "secret-with-backtick`",
        EMAIL_HOST: "smtp.gmail.com",
        EMAIL_PORT: "587",
        EMAIL_USER: "admin@example.com",
        EMAIL_PASS: "your_app_password",
    });

    assert.equal(report.ok, false);
    assert.deepEqual(report.placeholderValues, ["EMAIL_PASS"]);
    assert.deepEqual(report.malformedSecrets, ["RAZORPAY_KEY_SECRET"]);
});

test("passes when required env values are valid", () => {
    const report = getEnvReadinessReport({
        MONGO_URI: "mongodb://example",
        JWT_SECRET: "super-secret",
        RAZORPAY_KEY_ID: "rzp_test_123",
        RAZORPAY_KEY_SECRET: "secret_value_123",
        EMAIL_HOST: "smtp.gmail.com",
        EMAIL_PORT: "587",
        EMAIL_USER: "admin@example.com",
        EMAIL_PASS: "app-password",
    });

    assert.equal(report.ok, true);
});
