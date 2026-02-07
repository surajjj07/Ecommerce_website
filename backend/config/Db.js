import mongoose from "mongoose"

export const DbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB is connected successfully...🎉✅")
    } catch (error) {
        console.log(error.message)
    }
}