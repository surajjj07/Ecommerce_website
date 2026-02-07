import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        title: String,
        amount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
