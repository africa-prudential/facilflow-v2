import { C } from "./theme.js";
import { DOC_TYPES, VEHICLE_STATUSES, DRIVER_STATUSES, ADMIN_ROLE_TYPES } from "./constants.js";

export const docStatus = (expiryDate) => {
  if (!expiryDate) return {l:"No Record", color:C.muted, bg:"#F8FAFC"};
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days < 0)  return {l:"Expired",       color:C.red,   bg:C.redBg,   days};
  if (days <= 7) return {l:"Expiring Soon", color:C.amber, bg:C.amberBg, days};
  return              {l:"Valid",          color:C.green, bg:C.greenBg, days};
};

export const worstDocStatus = (docs=[]) => {
  const statuses = DOC_TYPES.map(t => {
    const d = docs.find(x=>x.document_type===t);
    return docStatus(d?.expiry_date);
  });
  if (statuses.some(s=>s.l==="Expired"))       return {l:"Expired",       color:C.red,   bg:C.redBg};
  if (statuses.some(s=>s.l==="Expiring Soon")) return {l:"Expiring Soon", color:C.amber, bg:C.amberBg};
  if (statuses.some(s=>s.l==="Valid"))         return {l:"Valid",          color:C.green, bg:C.greenBg};
  return {l:"No Docs", color:C.muted, bg:"#F8FAFC"};
};

// Returns all effective admin roles for a user (handles backward compat with 'admin')
export const getAdminRoles = (user) => {
  if (!user) return [];
  const primary = user.role === "admin" ? "super_admin" : user.role;
  const extra   = Array.isArray(user.admin_roles) ? user.admin_roles : [];
  const merged  = new Set([...(ADMIN_ROLE_TYPES.includes(primary) ? [primary] : []), ...extra]);
  return [...merged];
};

// True if user can access a module that requires any of the given admin roles
export const hasAdminAccess = (user, roles) => {
  const userRoles = getAdminRoles(user);
  if (userRoles.includes("super_admin")) return true;
  const check = Array.isArray(roles) ? roles : [roles];
  return check.some(r => userRoles.includes(r));
};

export const isSuperAdmin = (user) => getAdminRoles(user).includes("super_admin");

// Turns a raw snake_case/SCREAMING_SNAKE identifier (status, role, audit
// action, etc.) into a consistent "Title Case" label, regardless of the
// source string's own casing convention.
export const humanize = s => !s ? "" : String(s).toLowerCase().replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());

// Capitalizes only the first character of free-text input (e.g. ticket titles),
// leaving the rest untouched so acronyms/proper nouns aren't mangled.
export const sentenceCase = s => !s ? "" : String(s).charAt(0).toUpperCase() + String(s).slice(1);

// Deep-compares two form-state objects (ignoring any keys in `ignore`, e.g.
// a File field that can't be JSON-compared) to tell whether an edit form
// has any unsaved changes yet.
export const isDirty = (current, initial, ignore=[]) => {
  const strip = o => Object.fromEntries(Object.entries(o||{}).filter(([k])=>!ignore.includes(k)));
  return JSON.stringify(strip(current)) !== JSON.stringify(strip(initial));
};

export const fmtDT = d => new Date(d).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
export const fmtD  = d => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
export const genId = p => `${p}${Date.now()}${Math.random().toString(36).slice(2,5)}`;
export const now   = () => new Date().toISOString();
export const vsm   = v => VEHICLE_STATUSES.find(s=>s.v===v)||{l:v,color:C.muted,bg:"#F8FAFC"};
export const dsm   = v => DRIVER_STATUSES.find(s=>s.v===v)||{l:v,color:C.muted,bg:"#F8FAFC"};

// DB → UI field normalizers (DB is snake_case, UI expects camelCase from original seed)
export const normCR  = cr => cr ? ({...cr, changeType:cr.change_type??cr.changeType, riskLevel:cr.risk_level??cr.riskLevel, deployDate:cr.deploy_date??cr.deployDate, deployStart:cr.deploy_start??cr.deployStart, deployEnd:cr.deploy_end??cr.deployEnd, isEmergency:cr.is_emergency??cr.isEmergency, systemName:cr.system_name??cr.systemName, createdAt:cr.created_at??cr.createdAt, updatedAt:cr.updated_at??cr.updatedAt }) : cr;
export const normVeh = v  => v  ? ({...v,  driverId:v.driver_id??v.driverId, lastUpdated:v.updated_at??v.lastUpdated, createdAt:v.created_at??v.createdAt, ownershipType:v.ownership_type??v.ownershipType, companyName:v.company_name??v.companyName, coOwnerName:v.co_owner_name??v.coOwnerName }) : v;
export const normSub  = s  => s  ? ({...s,  renewalDate:s.renewal_date??s.renewalDate, billingCycle:s.billing_cycle??s.billingCycle, prevCost:s.prev_cost??s.prevCost, attachmentUrl:s.attachment_url??s.attachmentUrl, assignedOwners:s.assigned_owners??s.assignedOwners??[], assignedDept:s.assigned_dept??s.assignedDept, reminderSchedule:s.reminder_schedule??s.reminderSchedule??["monthly"], lastUpdated:s.updated_at??s.lastUpdated, createdAt:s.created_at??s.createdAt }) : s;
export const normDrv = d  => d  ? ({...d,  vehicleId:d.vehicle_id??d.vehicleId, lastUpdated:d.updated_at??d.lastUpdated, createdAt:d.created_at??d.createdAt }) : d;
export const normInv = i  => i  ? ({...i,  desc:i.description??i.desc, lastUpdated:i.updated_at??i.lastUpdated, createdAt:i.created_at??i.createdAt }) : i;
export const normAudit = a => a ? ({...a,  at:a.created_at??a.at, by:a.performed_by??a.by }) : a;
export const resolveNames = (ids, users) => (ids||[]).map(id=>(users||[]).find(u=>u.id===id)?.name).filter(Boolean).join(", ");
export const normLicence = l => l ? ({...l, issuingAuthority:l.issuing_authority??l.issuingAuthority, licenceNumber:l.licence_number??l.licenceNumber, expiryDate:l.expiry_date??l.expiryDate, attachmentUrl:l.attachment_url??l.attachmentUrl, lastUpdated:l.updated_at??l.lastUpdated, createdAt:l.created_at??l.createdAt }) : l;

// True if two Pool Car request date/time windows overlap. Defensive about
// missing data — an incomplete window never counts as an overlap.
export const poolCarWindowsOverlap = (a, b) => {
  if (!a?.date || !a?.start || !a?.end || !b?.date || !b?.start || !b?.end) return false;
  const aStart = new Date(`${a.date}T${a.start}:00`), aEnd = new Date(`${a.date}T${a.end}:00`);
  const bStart = new Date(`${b.date}T${b.start}:00`), bEnd = new Date(`${b.date}T${b.end}:00`);
  return aStart < bEnd && bStart < aEnd;
};

// True if a Pool Car request's date/time window covers right now.
export const poolCarWindowActiveNow = (details) => {
  if (!details?.date || !details?.start || !details?.end) return false;
  const start = new Date(`${details.date}T${details.start}:00`), end = new Date(`${details.date}T${details.end}:00`);
  const now = new Date();
  return now >= start && now <= end;
};
export const fmtSafe = d => { if(!d) return "—"; const dt = new Date(d); return isNaN(dt) ? "—" : dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); };
export const normTicket = t => t ? ({...t, title:t.subject??t.title, ticketType:t.ticket_type??t.ticketType??t.type, priorityAuto:t.priority_auto??t.priorityAuto, impactDetails:t.impact_details??t.impactDetails, requesterId:t.requester_id??t.requesterId, assigneeId:t.assignee_id??t.assigneeId, productService:t.product_service??t.productService, supportLevel:t.support_level??t.supportLevel, assetId:t.asset_id??t.assetId, assetFreeText:t.asset_free_text??t.assetFreeText, linkedCrId:t.linked_cr_id??t.linkedCrId, resolutionNotes:t.resolution_notes??t.resolutionNotes, resolutionStatus:t.resolution_status??t.resolutionStatus, rootCause:t.root_cause??t.rootCause, resolvedAt:t.resolved_at??t.resolvedAt, closedAt:t.closed_at??t.closedAt, createdAt:t.created_at??t.createdAt, updatedAt:t.updated_at??t.updatedAt }) : t;

// Exports rows to a downloaded CSV. `columns` is [{key, label}]; values are read via row[key].
export const exportCSV = (filename, columns, rows) => {
  const esc = v => {
    const s = v==null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const lines = [
    columns.map(c=>esc(c.label)).join(","),
    ...rows.map(row => columns.map(c=>esc(row[c.key])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
