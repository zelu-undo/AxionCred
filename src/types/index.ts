export type TenantPlan = "starter" | "professional" | "business" | "enterprise"

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: TenantPlan
  created_at: string
  updated_at: string
}

export interface TenantSettings {
  id: string
  tenant_id: string
  key: string
  value: string
}

export type UserRole = "owner" | "admin" | "manager" | "operator"

export interface User {
  id: string
  tenant_id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  tenant_id: string
  name: string
  permissions: string[]
}

export type CustomerStatus = "active" | "inactive" | "blocked"

export interface Customer {
  id: string
  tenant_id: string
  name: string
  email?: string
  phone: string
  document?: string
  address?: string
  notes?: string
  global_identity_id?: string
  status: CustomerStatus
  credit_limit?: number
  created_at: string
  updated_at: string
}

export interface CustomerDocument {
  id: string
  customer_id: string
  category: string
  file_url: string
  file_name: string
  created_at: string
}

export interface CustomerEvent {
  id: string
  customer_id: string
  type: string
  description: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type LoanStatus = "pending" | "active" | "paid" | "cancelled" | "renegotiated"

export interface Loan {
  id: string
  tenant_id: string
  customer_id: string
  principal_amount: number
  interest_rate: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  installments_count: number
  paid_installments: number
  status: LoanStatus
  notes?: string
  parent_loan_id?: string
  created_at: string
  updated_at: string
}

export type InstallmentStatus = "pending" | "paid" | "late" | "cancelled"

export interface LoanInstallment {
  id: string
  loan_id: string
  installment_number: number
  amount: number
  paid_amount?: number
  due_date: string
  paid_date?: string
  status: InstallmentStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface PaymentProof {
  id: string
  tenant_id: string
  loan_id: string
  installment_id?: string
  file_url: string
  file_name: string
  amount: number
  payment_date: string
  created_at: string
}

export type PaymentMethod = "cash" | "pix" | "boleto" | "card" | "transfer"

export interface PaymentTransaction {
  id: string
  tenant_id: string
  loan_id: string
  installment_id?: string
  method: PaymentMethod
  amount: number
  status: "pending" | "completed" | "failed"
  gateway_id?: string
  gateway_response?: Record<string, unknown>
  created_at: string
}

export interface GlobalIdentity {
  id: string
  hash: string
  created_at: string
}

export interface GlobalCreditProfile {
  id: string
  global_identity_id: string
  total_loans: number
  total_paid: number
  total_late: number
  average_score: number
  last_updated: string
}

export interface CreditScoreHistory {
  id: string
  global_credit_profile_id: string
  score: number
  calculated_at: string
}

export interface CreditDecision {
  id: string
  tenant_id: string
  customer_id: string
  recommended_amount: number
  recommended_rate: number
  recommended_installments: number
  score: number
  factors: Record<string, unknown>
  created_at: string
}

export interface ReminderSettings {
  id: string
  tenant_id: string
  enabled: boolean
  days_before: number[]
  hours: number[]
  methods: ("whatsapp" | "sms" | "email")[]
}

export interface ReminderLog {
  id: string
  tenant_id: string
  customer_id: string
  loan_id: string
  installment_id: string
  method: "whatsapp" | "sms" | "email"
  status: "sent" | "failed"
  sent_at: string
}

export interface WhatsAppMessage {
  id: string
  tenant_id: string
  customer_id: string
  loan_id?: string
  phone: string
  message: string
  status: "pending" | "sent" | "delivered" | "failed"
  whatsapp_id?: string
  sent_at: string
}

export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  tenant_id: string
  type: string
  title: string
  message?: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface DashboardStats {
  total_customers: number
  active_loans: number
  total_to_receive: number
  total_received: number
  overdue_amount: number
  overdue_count: number
}

// Staff and Roles types
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled"

export interface StaffMember {
  id: string
  owner_id: string
  name: string
  email: string
  role_id?: string
  role_name?: string
  status: "active" | "inactive"
  invitation_status: InvitationStatus
  invitation_sent_at?: string
  invitation_accepted_at?: string
  created_at: string
  updated_at: string
}

export interface RolePermission {
  module: string
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

export interface CustomRole {
  id: string
  owner_id: string
  name: string
  description?: string
  permissions: RolePermission[]
  is_default: boolean
  created_at: string
  updated_at: string
}
