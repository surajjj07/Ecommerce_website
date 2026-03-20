export const getEffectiveProductPrice = (product) => {
    const basePrice = Number(product?.price || 0);
    const discountPrice = Number(product?.discountPrice || 0);

    if (discountPrice > 0 && discountPrice < basePrice) {
        return discountPrice;
    }

    return basePrice;
};
