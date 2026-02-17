import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

const escapeRegex = (value = '') =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const addProduct = async (req, res) => {
    try {
        const ALLOWED_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
        const {
            name,
            sku,
            description,
            price,
            discountPrice,
            category,
            brand,
            stock,
            featured,
            bestseller
        } = req.body;

        const parsedPrice = Number(price);
        const parsedDiscountPrice = Number(discountPrice || 0);
        const parsedStock = Number(stock);
        const normalizedCategory = String(category || '').trim();

        if (!name || !sku || !description) {
            return res.status(400).json({ success: false, message: 'Name, SKU, and description are required' });
        }
        if (!normalizedCategory) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ success: false, message: 'Valid price is required' });
        }

        if (Number.isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0) {
            return res.status(400).json({ success: false, message: 'Discount price must be 0 or greater' });
        }

        if (parsedDiscountPrice > parsedPrice) {
            return res.status(400).json({ success: false, message: 'Discount price cannot be greater than price' });
        }

        if (Number.isNaN(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ success: false, message: 'Valid stock is required' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one product image is required' });
        }

        const normalizeSizes = (input) => {
            const extractSizes = (value) => {
                if (Array.isArray(value)) {
                    return value.flatMap(extractSizes);
                }

                if (value === undefined || value === null || value === '') {
                    return [];
                }

                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (!trimmed) return [];

                    // Direct single size (common multipart case)
                    if (ALLOWED_SIZES.has(trimmed.toUpperCase())) {
                        return [trimmed];
                    }

                    // JSON payload support: '["S","M"]' or nested arrays.
                    try {
                        return extractSizes(JSON.parse(trimmed));
                    } catch {
                        // Fallback for non-JSON array-like strings: "[ [ 'S', 'M' ], 'L' ]"
                        const matches = trimmed.match(/\b(?:XXL|XL|XS|S|M|L)\b/g);
                        return matches && matches.length ? matches : [trimmed];
                    }
                }

                return [String(value)];
            };

            const flattened = extractSizes(input)
                .map((s) => String(s).trim().toUpperCase())
                .filter(Boolean);

            const unique = [...new Set(flattened)];
            const invalid = unique.filter((s) => !ALLOWED_SIZES.has(s));
            const valid = unique.filter((s) => ALLOWED_SIZES.has(s));

            return { valid, invalid };
        };

        const { valid: sizes, invalid: invalidSizes } = normalizeSizes(req.body.sizes);
        if (invalidSizes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid sizes: ${invalidSizes.join(', ')}`
            });
        }

        const parseBoolean = (value) => value === true || value === 'true';
        const featuredFlag = parseBoolean(featured);
        const bestsellerFlag = parseBoolean(bestseller);

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'products' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result?.secure_url || result?.url || '');
                    }
                );
                stream.end(file.buffer);
            });
        });
        const images = (await Promise.all(uploadPromises)).filter(Boolean);
        if (images.length === 0) {
            return res.status(500).json({ success: false, message: 'Image upload failed. Please try again.' });
        }

        const product = new Product({
            name,
            sku,
            description,
            price: parsedPrice,
            discountPrice: parsedDiscountPrice,
            category: normalizedCategory,
            brand,
            stock: parsedStock,
            sizes,
            featured: featuredFlag,
            bestseller: bestsellerFlag,
            images
        });

        await product.save();

        res.status(201).json({ success: true, message: 'Product added successfully', product });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.sku) {
            return res.status(409).json({ success: false, message: 'SKU already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        res.json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category, isActive: true });
        res.json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product || !product.isActive) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();
        const category = String(req.query.category || '').trim();

        if (!query && !category) {
            return res.status(400).json({ message: 'Search query or category is required' });
        }

        const filter = { isActive: true };

        if (category) {
            filter.category = {
                $regex: `^${escapeRegex(category)}$`,
                $options: 'i'
            };
        }

        if (query) {
            const qRegex = { $regex: escapeRegex(query), $options: 'i' };
            filter.$or = [
                { name: qRegex },
                { description: qRegex },
                { category: qRegex }
            ];
        }

        const products = await Product.find(filter);
        res.json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
