// Turns a raw snake_case/SCREAMING_SNAKE identifier (status, role, audit
// action, etc.) into a consistent "Title Case" label, regardless of the
// source string's own casing convention.
export const humanize = s => !s ? "" : String(s).toLowerCase().replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());

// Strips HTML tags from rich-text fields (e.g. CR description/rollback) so
// they can be matched against plain-text search queries.
export const stripHtml = html => !html ? "" : String(html).replace(/<[^>]*>/g," ");

// Capitalizes only the first character of free-text input (e.g. ticket titles),
// leaving the rest untouched so acronyms/proper nouns aren't mangled.
export const sentenceCase = s => !s ? "" : String(s).charAt(0).toUpperCase() + String(s).slice(1);

export const fmtDT = d => { try { if(!d) return "—"; const dt=new Date(d); return isNaN(dt)?"—":dt.toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); } catch(e){ return "—"; }};
export const fmtD  = d => { try { if(!d) return "—"; const dt=new Date(d); return isNaN(dt)?"—":dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); } catch(e){ return "—"; }};
export const uid   = p => `${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
export const crId  = n => `CR-${String(n).padStart(6,"0")}`;
export const reqId = (y,n) => `REQ-${y}-${String(n).padStart(3,"0")}`;

// DB returns snake_case; UI components use camelCase from original seed data.
// These normalizers let both coexist without rewriting every component.
export const normCR = cr => cr ? ({
  ...cr,
  changeType:  cr.change_type   ?? cr.changeType,
  riskLevel:   cr.risk_level    ?? cr.riskLevel,
  deployDate:  cr.deploy_date   ?? cr.deployDate,
  deployStart: cr.deploy_start  ?? cr.deployStart,
  deployEnd:   cr.deploy_end    ?? cr.deployEnd,
  isEmergency: cr.is_emergency  ?? cr.isEmergency,
  systemName:  cr.system_name   ?? cr.systemName,
  createdAt:   cr.created_at    ?? cr.createdAt,
  updatedAt:   cr.updated_at    ?? cr.updatedAt,
}) : cr;

export const normReq = r => r ? ({
  ...r,
  submittedBy: r.submitted_by  ?? r.submittedBy,
  submittedAt: r.created_at    ?? r.submittedAt,
  approverId:  r.approver_id   ?? r.approverId,
}) : r;
