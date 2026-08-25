/**
 * ============================================================================
 * MODEL: User (Mongoose Schema & Document Definition)
 * ============================================================================
 * Defines the MongoDB schema and TypeScript interface for system users.
 * Supports Role-Based Access Control (RBAC):
 *   - 'admin': Full access to all leads, user management, system configs, distribution.
 *   - 'sales_rep': Access to assigned leads, status progression, outreach notes & tasks.
 * ============================================================================
 */

import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole } from "../../src/types/index.js";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  teamMemberId?: string | null;
  avatarColor?: string;
  phone?: string | null;
  active: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUserDocument> = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "User full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "User email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "sales_rep"],
      default: "sales_rep",
      required: true,
      index: true,
    },
    teamMemberId: {
      type: String,
      default: null,
    },
    avatarColor: {
      type: String,
      default: "#6366f1",
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Export Mongoose Model
export const User: Model<IUserDocument> =
  (mongoose.models.User as Model<IUserDocument>) ||
  mongoose.model<IUserDocument>("User", UserSchema);
