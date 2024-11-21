import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  const user = this;
  if (user.isModified("password")) {
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  } else {
    next();
  }
});

// Middleware to hash password before updating
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    try {
      // Find the current user data
      const user = await this.model.findOne(this.getQuery());
      const isSamePassword = await bcrypt.compare(
        update.password,
        user.password
      );
      if (!isSamePassword) {
        // Hash the new password if it's different
        const hashedPassword = await bcrypt.hash(update.password, 10);
        update.password = hashedPassword;
      } else {
        // If the password is the same, remove it from the update
        delete update.password;
      }
    } catch (err) {
      return next(err);
    }
  }

  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
