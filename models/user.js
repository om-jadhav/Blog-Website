const { createHmac, randomBytes } = require('crypto');
const { Schema, model } = require('mongoose');
const { createTokenForUser } = require('../Services/authentication');

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
    },
    Password: {
        type: String,
        required: true,
        unique: true,
    },
    profileImageURL: {
        type: String,
        default: function () {
            // Dynamic avatar using fullName as seed (Dicebear API)
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.fullName || 'defaultuser'}`;
        },
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER",
    }
}, { timestamps: true });

userSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified("Password")) return next();

    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac('sha256', salt)
        .update(user.Password)
        .digest("hex");

    this.salt = salt;
    this.Password = hashedPassword;
    next();
});

userSchema.static('matchPasswordAndGenerateToken', async function (email, Password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('User not found');

    const salt = user.salt;
    const hashedPassword = user.Password;

    const userProvidedHash = createHmac("sha256", salt)
        .update(Password)
        .digest("hex");

    if (hashedPassword !== userProvidedHash) throw new Error('Incorrect Password');

    const token = createTokenForUser(user);
    return token;
});

const User = model('user', userSchema);

module.exports = User;
