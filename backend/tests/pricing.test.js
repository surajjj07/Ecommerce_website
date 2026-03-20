import test from "node:test";
import assert from "node:assert/strict";
import { getEffectiveProductPrice } from "../utils/pricing.js";

test("returns discount price when it is lower than base price", () => {
    assert.equal(getEffectiveProductPrice({ price: 1000, discountPrice: 799 }), 799);
});

test("returns base price when discount price is missing or invalid", () => {
    assert.equal(getEffectiveProductPrice({ price: 1000, discountPrice: 0 }), 1000);
    assert.equal(getEffectiveProductPrice({ price: 1000, discountPrice: 1200 }), 1000);
});
