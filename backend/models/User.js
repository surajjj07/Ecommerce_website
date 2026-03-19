import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePic: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ""
    },
    defaultAddress: {
        name: { type: String, default: "" },
        phone: { type: String, default: "" },
        addressLine1: { type: String, default: "" },
        addressLine2: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        pincode: { type: String, default: "" },
        country: { type: String, default: "India" },
        email: { type: String, default: "" }
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
