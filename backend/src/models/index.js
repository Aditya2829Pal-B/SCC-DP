/**
 * Mongoose Models — User, Complaint, Alert, Notification
 */
import mongoose from 'mongoose';

// ── User Schema ──
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'citizen', 'department_officer', 'city_admin', 'state_admin', 'disaster_authority'], default: 'user' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [77.2090, 28.6139] },
    city: { type: String, default: 'New Delhi' },
  },
  sensitivity: { type: Number, default: 1.0 },
  fcmToken: { type: String },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// ── Complaint Schema ──
const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'], default: 'Submitted' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] },
    address: { type: String },
  },
  imageUrl: { type: String },
  nlpCategory: { type: String },
  nlpConfidence: { type: Number },
  adminNotes: { type: String },
  department: { type: String },
  departmentId: { type: String },
  adminLevel: { type: String, enum: ['city', 'state'] },
  assignedOfficer: { type: String },
  departmentContact: { type: String },
  assignedDepartment: { type: String },
  assignedCityAuthority: { type: String },
  assignedStateAuthority: { type: String },
  escalated: { type: Boolean, default: false },
  escalatedAt: { type: Date },
  escalationHistory: [
    {
      escalatedAt: { type: Date, default: Date.now },
      reason: { type: String },
      previousLevel: { type: String },
      newLevel: { type: String }
    }
  ],
}, { timestamps: true });

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1, category: 1 });
complaintSchema.index({ departmentId: 1, adminLevel: 1 });

// ── Alert Schema ──
const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  type: { type: String },
  location: { type: String },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  read: { type: Boolean, default: false },
  riskScore: { type: Number },
}, { timestamps: true });

alertSchema.index({ severity: 1, createdAt: -1 });
alertSchema.index({ targetUsers: 1 });

// ── Notification Schema ──
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  link: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

// ── Audit Log Schema ──
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  targetResource: { type: String },
  targetId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
}, { timestamps: true });

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1 });

export const User = mongoose.model('User', userSchema);
export const Complaint = mongoose.model('Complaint', complaintSchema);
export const Alert = mongoose.model('Alert', alertSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
