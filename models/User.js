const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
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
            required: true
        },

        role: {
            type: String,
            enum: ["user", "parent", "admin"],
            default: "user"
        },

        // For our child-safety feature
        isSupervised: {
            type: Boolean,
            default: false
        },

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        spendingLimit: {
            type: Number,
            default: 500
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);