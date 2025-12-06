import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt, { genSalt } from "bcrypt";
import validator from "validator";

export enum AdminRole {
  ADMIN = "admin",
  VIEWER = "viewer",
}

export interface IAdmin {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminDocument extends IAdmin, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAdminModel extends Model<IAdminDocument> {
  findByEmail(email: string): Promise<IAdminDocument | null>;
  findActiveAdmins(role?: AdminRole): Promise<IAdminDocument[]>;
}

const adminSchema = new Schema<IAdminDocument, IAdminModel>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"],
    minlength: [2, "Name must be at least 2 characters"],
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: v => validator.isEmail(v),
      message: props => `${props.value} is not a valid email!`
    },
    immutable: true,
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false
  },

  role: {
    type: String,
    enum: {
      values: Object.values(AdminRole),
      message: "Role must be 'admin' or 'viewer'",
    },
    default: AdminRole.VIEWER,
    required: [true, "Role is required"],
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  lastLogin: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      const { password, __v, ...cleanedRet } = ret;
      return cleanedRet;
    },
  },
  toObject: {
    transform: (_doc, ret) => {
      const { password, __v, ...cleanedRet } = ret;
      return cleanedRet;
    },
  },
});

adminSchema.index({ email: 1, isActive: 1 });
adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ createdAt: -1 });

adminSchema.pre<IAdminDocument>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!candidatePassword || typeof candidatePassword !== "string") {
    return false;
  }

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};


const Admin = mongoose.model<IAdminDocument, IAdminModel>("Admin", adminSchema);
export default Admin;