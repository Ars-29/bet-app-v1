import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxLength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxLength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters long"],
      validate: {
        validator: function (password) {
          // Check for at least 1 lowercase, 1 uppercase, 1 number, and 1 special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            password
          );
        },
        message:
          "Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character",
      },
    },
    dateOfBirth: {
      day: {
        type: Number,
        required: [true, "Birth day is required"],
        min: 1,
        max: 31,
      },
      month: {
        type: Number,
        required: [true, "Birth month is required"],
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: [true, "Birth year is required"],
        min: 1900,
        max: new Date().getFullYear() - 18, // Must be at least 18 years old
      },
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    balance:{
      type: Number,
      default: 1000,
      
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Check if user is of legal age (18+)
userSchema.methods.isOfLegalAge = function () {
  const today = new Date();
  const birthDate = new Date(
    this.dateOfBirth.year,
    this.dateOfBirth.month - 1,
    this.dateOfBirth.day
  );
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

const User = mongoose.model("User", userSchema);

export default User;
