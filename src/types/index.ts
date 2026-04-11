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
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
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
  amount: number
  interest_rate: number
  interest_type: string
  total_amount: number
  installments: number
  installment_amount: number
  paid_amount: number
  remaining_amount: number
  status: LoanStatus
  notes?: string
  created_at: string
  updated_at: string
  // For tRPC joined queries
  customer?: {
    name?: string
    document?: string
    phone?: string
    email?: string
  }
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
  // Late fee fields
  late_fee_applied?: number
  late_interest_applied?: number
  days_in_delay?: number
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

// ============================================
// Additional Types for frontend components
// ============================================

export interface InterestRule {
  id: string
  tenant_id: string
  name: string
  min_installments: number
  max_installments: number
  interest_rate: number
  interest_type: "monthly" | "annual" | "flat"
  created_at: string
}

export interface LateFeeConfig {
  tenant_id: string
  enabled: boolean
  fixed_fee?: number
  percentage?: number
  daily_interest?: number
  max_days?: number
}

export interface BusinessRules {
  tenant_id: string
  interestRules?: InterestRule[]
  lateFeeConfig?: LateFeeConfig
  lateInterestConfig?: LateFeeConfig
  maxBoxPercentage?: number
  minScoreForApproval?: number
  clientLimitMandatory?: boolean
  blockOnLowScore?: boolean
  maxActiveLoansPerCustomer?: number
}

export interface AlertPayment {
  id: string
  loan_id: string
  installment_id: string
  customer_id: string
  customer_name: string
  amount: number
  due_date: string
  status: "pending" | "late" | "paid"
}

export interface AlertData {
  payments: AlertPayment[]
  total_amount: number
  count: number
}

export interface PaymentRecord {
  id: string
  loan_id: string
  customer_id: string
  customer_name: string
  installment_number: number
  amount: number
  paid_amount?: number
  due_date: string
  paid_date?: string
  status: InstallmentStatus
  method?: PaymentMethod
}

export interface Guarantor {
  id: string
  tenant_id: string
  name: string
  document?: string
  document_type?: string
  phone?: string
  email?: string
  address?: string
  guarantee_type: "property" | "vehicle" | "personal" | "payroll"
  property_address?: string
  property_type?: string
  property_value?: number
  vehicle_brand?: string
  vehicle_model?: string
  vehicle_year?: string
  vehicle_plate?: string
  vehicle_value?: number
  linked_loan_id?: string
  status: "active" | "inactive"
  notes?: string
  created_at: string
}

export interface Renegotiation {
  id: string
  tenant_id: string
  loan_id: string
  renegotiation_date: string
  original_total_amount: number
  original_installments_count: number
  new_total_amount: number
  new_installments_count: number
  new_installment_amount: number
  interest_rate?: number
  status: "pending" | "approved" | "rejected" | "cancelled"
  notes?: string
  created_at: string
  // For tRPC joined queries
  loan?: {
    customer?: {
      name?: string
      document?: string
    }
  }
}

// Dashboard-specific types
export interface DashboardRecentLoan {
  id: string
  name: string
  amount: number
  totalAmount: number
  installments: number
  paidInstallments: number
  status: LoanStatus
  createdAt: string
}

export interface DashboardOverdueCustomer {
  name: string
  count: number
  amount: number
}

export interface DashboardResponse {
  stats: DashboardStats
  recentLoans: DashboardRecentLoan[]
  overdueCustomers: DashboardOverdueCustomer[]
}
