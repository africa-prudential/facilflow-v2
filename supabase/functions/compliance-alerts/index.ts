import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── Schedule this function in Supabase Dashboard → Edge Functions → Cron ──
// Cron expression: 0 11 * * *   (daily at 11:00 UTC = 12:00 PM WAT)

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY    = Deno.env.get("RESEND_API_KEY") ?? ""
const FROM_EMAIL        = "facilflow@africaprudential.com"
const FROM_NAME         = "Facilflow — Africa Prudential"
const ADMIN_APP_URL     = Deno.env.get("ADMIN_APP_URL") ?? "https://admin-facilflow.africaprudential.com"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const B   = "#C8102E"
const INK = "#0F172A"
const MUT = "#64748B"
const BDR = "#E2E8F0"
const BG  = "#F7F8FA"
const AMB = "#D97706"
const ABG = "#FFFBEB"
const RED = "#DC2626"
const RBG = "#FEF2F2"
const GRN = "#059669"
const GBG = "#ECFDF5"
const BLU = "#2563EB"

const LOGO = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="${B}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="#fff">AP</text></svg>`

function wrap(inner: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Facilflow</title></head>
<body style="margin:0;padding:0;background:${BG}">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:#fff;border-radius:12px;border:1px solid ${BDR};overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
${inner}
</td></tr>
<tr><td style="padding:20px 0;text-align:center">
<div style="font-family:Arial,sans-serif;font-size:11px;color:${MUT};margin-bottom:4px"><strong style="color:${INK}">Africa Prudential Plc</strong> · Facilflow Facilities Management</div>
<div style="font-family:Arial,sans-serif;font-size:11px;color:#94A3B8">This is an automated message. Please do not reply.</div>
</td></tr></table></td></tr></table></body></html>`
}

function hdr(color: string, title: string, sub: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${color}">
<tr><td style="padding:28px 32px">
<table cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:16px;vertical-align:middle">${LOGO}</td>
<td style="vertical-align:middle">
<div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Africa Prudential Plc</div>
<div style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:#fff">${title}</div>
<div style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">${sub}</div>
</td></tr></table></td></tr></table>`
}

function body(content: string) {
  return `<div style="padding:28px 32px">${content}</div>`
}

function tblRow(label: string, value: string) {
  return `<tr>
<td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${MUT};text-transform:uppercase;letter-spacing:0.8px;width:140px;background:#F8FAFC;border-bottom:1px solid ${BDR}">${label}</td>
<td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:13px;color:${INK};font-weight:500;border-bottom:1px solid ${BDR}">${value||"—"}</td></tr>`
}

function tbl(rows: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BDR};border-radius:8px;overflow:hidden;margin-bottom:20px">${rows}</table>`
}

function cta(url: string, label: string, color: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td style="background:${color};border-radius:8px"><a href="${url}" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;text-decoration:none">${label}</a></td></tr></table>`
}

function hl(text: string, color: string, bg: string) {
  return `<div style="background:${bg};border-left:3px solid ${color};border-radius:0 6px 6px 0;padding:12px 16px;margin:16px 0;font-family:Arial,sans-serif;font-size:13px;color:${color};line-height:1.6">${text}</div>`
}

function p(text: string) {
  return `<p style="font-family:Arial,sans-serif;font-size:14px;color:#334155;margin:0 0 16px;line-height:1.7">${text}</p>`
}

async function sendEmail(to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.json()
    console.error("Resend error:", JSON.stringify(err))
  }
  return res.ok
}

// Fixed day-thresholds a vehicle document alerts at before expiry, then
// weekly buckets (-7, -14, -21, ...) once overdue. Each doc gets exactly
// one email per milestone crossed, tracked via last_reminder_milestone.
const DOC_MILESTONES = [30, 14, 7, 3, 1, 0]

function docMilestone(daysRemaining: number): number {
  if (daysRemaining >= 0) {
    const candidates = DOC_MILESTONES.filter(m => daysRemaining <= m)
    return candidates.length ? Math.min(...candidates) : DOC_MILESTONES[0]
  }
  const weeksOverdue = Math.ceil(Math.abs(daysRemaining) / 7)
  return -7 * weeksOverdue
}

// Maps each reminder_schedule entry to a repeat interval in days; a
// subscription with multiple selected cadences uses the shortest one.
const CADENCE_DAYS: Record<string, number> = { daily: 1, every_2_weeks: 14, monthly: 30, quarterly: 90 }

function subIntervalDays(schedule: string[] | null | undefined): number {
  const list = Array.isArray(schedule) && schedule.length ? schedule : ["monthly"]
  const intervals = list.map(s => CADENCE_DAYS[s] ?? 30)
  return Math.min(...intervals)
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // ── 1. VEHICLE DOCUMENT ALERTS ─────────────────────────────
    const { data: docs } = await db
      .from("vehicle_documents")
      .select("*, vehicles(plate, model, tenant_id)")

    // Get facility admin emails per tenant
    const { data: facilityAdmins } = await db
      .from("users")
      .select("email, tenant_id")
      .in("role", ["facility_admin"])
      .eq("status", "active")

    const adminsByTenant: Record<string, string[]> = {}
    for (const u of facilityAdmins || []) {
      if (!adminsByTenant[u.tenant_id]) adminsByTenant[u.tenant_id] = []
      if (u.email) adminsByTenant[u.tenant_id].push(u.email)
    }

    // Group docs due for a reminder (new milestone crossed) by tenant
    const docAlerts: Record<string, any[]> = {}
    for (const doc of docs || []) {
      const expiry = new Date(doc.expiry_date)
      const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
      if (days > 30) continue  // not yet within the alert window
      const milestone = docMilestone(days)
      if (doc.last_reminder_milestone === milestone) continue  // already alerted for this milestone
      const tenantId = doc.vehicles?.tenant_id
      if (!tenantId) continue
      if (!docAlerts[tenantId]) docAlerts[tenantId] = []
      docAlerts[tenantId].push({ ...doc, daysRemaining: days, milestone })
    }

    let docEmailsSent = 0
    let docAlertsCount = 0
    for (const [tenantId, alerts] of Object.entries(docAlerts)) {
      const recipients = adminsByTenant[tenantId] || []
      if (!recipients.length) continue

      const rows = alerts.map(a =>
        tblRow(`${a.vehicles?.plate} — ${a.document_type}`,
          `${a.daysRemaining < 0 ? `<span style="color:${RED};font-weight:700">EXPIRED ${Math.abs(a.daysRemaining)} days ago</span>` : `<span style="color:${a.daysRemaining<=7?AMB:GRN};font-weight:700">${a.daysRemaining} day(s) remaining</span>`} · Expires: ${new Date(a.expiry_date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}`)
      ).join("")

      const hasExpired = alerts.some(a => a.daysRemaining < 0)
      const headerColor = hasExpired ? RED : AMB
      const subject = `Vehicle Compliance Alert — ${alerts.length} document(s) require attention`

      const html = wrap(
        hdr(headerColor, "Vehicle Compliance Alert", `${alerts.length} document(s) expiring or expired`) +
        body(`
          ${p("The following vehicle compliance documents require attention:")}
          ${hl(hasExpired
            ? "⚠ One or more documents have already <strong>expired</strong>. Please renew immediately."
            : "⏰ One or more documents are approaching their expiry date. Please arrange renewal.",
            hasExpired ? RED : AMB,
            hasExpired ? RBG : ABG)}
          ${tbl(rows)}
          ${p("Log in to the Admin Console to update documents and upload renewal certificates.")}
          ${cta(ADMIN_APP_URL, "Go to Fleet Management →", headerColor)}
        `)
      )

      const sent = await sendEmail(recipients, subject, html)
      if (sent) {
        docEmailsSent += recipients.length
        docAlertsCount += alerts.length
        for (const a of alerts) {
          await db.from("vehicle_documents").update({ last_reminder_milestone: a.milestone }).eq("id", a.id)
        }
      }
    }

    // ── 2. IT SUBSCRIPTION ALERTS ──────────────────────────────
    const { data: subs } = await db
      .from("it_subscriptions")
      .select("*")
      .eq("status", "active")

    const { data: itAdmins } = await db
      .from("users")
      .select("email, tenant_id")
      .in("role", ["it_admin"])
      .eq("status", "active")

    const itAdminsByTenant: Record<string, string[]> = {}
    for (const u of itAdmins || []) {
      if (!itAdminsByTenant[u.tenant_id]) itAdminsByTenant[u.tenant_id] = []
      if (u.email) itAdminsByTenant[u.tenant_id].push(u.email)
    }

    // For resolving each subscription's assigned_owners (user IDs) to emails/names
    const { data: allUsers } = await db
      .from("users")
      .select("id, email, name, tenant_id")
      .eq("status", "active")
    const usersById: Record<string, any> = {}
    for (const u of allUsers || []) usersById[u.id] = u

    const subAlerts: Record<string, any[]> = {}
    for (const sub of subs || []) {
      const renewal = new Date(sub.renewal_date)
      const days = Math.ceil((renewal.getTime() - today.getTime()) / 86400000)
      if (days > 30 || days < 0) continue  // only within 30 days out, up to renewal date
      const intervalDays = subIntervalDays(sub.reminder_schedule)
      const lastSent = sub.last_reminder_sent_at ? new Date(sub.last_reminder_sent_at) : null
      const daysSinceLast = lastSent ? (today.getTime() - lastSent.getTime()) / 86400000 : Infinity
      if (daysSinceLast < intervalDays) continue  // not due yet per its configured cadence
      if (!subAlerts[sub.tenant_id]) subAlerts[sub.tenant_id] = []
      subAlerts[sub.tenant_id].push({ ...sub, daysRemaining: days })
    }

    let subEmailsSent = 0
    let subAlertsCount = 0
    for (const [tenantId, alerts] of Object.entries(subAlerts)) {
      const itAdminRecipients = itAdminsByTenant[tenantId] || []

      for (const sub of alerts) {
        const ownerIds: string[] = Array.isArray(sub.assigned_owners) ? sub.assigned_owners : []
        const ownerEmails = ownerIds.map(id => usersById[id]?.email).filter(Boolean)
        const ownerNames = ownerIds.map(id => usersById[id]?.name).filter(Boolean).join(", ")
        const recipients = [...new Set([...itAdminRecipients, ...ownerEmails])]
        if (!recipients.length) continue

        const isToday = sub.daysRemaining === 0
        const subject = isToday
          ? `Subscription Renewal Due Today — ${sub.name}`
          : `Subscription Alert — ${sub.name} renews in ${sub.daysRemaining} day(s)`

        const html = wrap(
          hdr(isToday ? RED : AMB, "Subscription Renewal Alert", isToday ? "Renewal due today" : `Renews in ${sub.daysRemaining} day(s)`) +
          body(`
            ${p(`Your <strong>${sub.name}</strong> subscription is ${isToday ? "<strong style='color:${RED}'>due for renewal today</strong>" : `renewing in <strong>${sub.daysRemaining} day(s)</strong>`}.`)}
            ${tbl(
              tblRow("Subscription", sub.name) +
              tblRow("Vendor", sub.vendor || "—") +
              tblRow("Category", sub.category || "—") +
              tblRow("Renewal Date", new Date(sub.renewal_date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})) +
              tblRow("Cost", sub.cost ? `₦${Number(sub.cost).toLocaleString()}` : "—") +
              tblRow("Billing Cycle", sub.billing_cycle || "—") +
              tblRow("Assigned Owner(s)", ownerNames || "—")
            )}
            ${isToday
              ? hl("⚠ This subscription is due for renewal <strong>today</strong>. Please process payment to avoid service interruption.", RED, RBG)
              : hl(`⏰ Renewal in <strong>${sub.daysRemaining} day(s)</strong>. Ensure payment is arranged before the renewal date.`, AMB, ABG)}
            ${cta(ADMIN_APP_URL, "View IT Subscriptions →", isToday ? RED : AMB)}
          `)
        )

        const sent = await sendEmail(recipients, subject, html)
        if (sent) {
          subEmailsSent += recipients.length
          subAlertsCount++
          await db.from("it_subscriptions").update({ last_reminder_sent_at: today.toISOString() }).eq("id", sub.id)
        }
      }
    }

    // ── 3. LICENCE ALERTS ───────────────────────────────────────
    // Same facility_admin audience and milestone dedup as vehicle docs —
    // reuses adminsByTenant and docMilestone() directly.
    const { data: licences } = await db
      .from("licences")
      .select("*")

    const licenceAlerts: Record<string, any[]> = {}
    for (const lic of licences || []) {
      if (!lic.expiry_date) continue
      const expiry = new Date(lic.expiry_date)
      const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
      if (days > 30) continue
      const milestone = docMilestone(days)
      if (lic.last_reminder_milestone === milestone) continue
      if (!licenceAlerts[lic.tenant_id]) licenceAlerts[lic.tenant_id] = []
      licenceAlerts[lic.tenant_id].push({ ...lic, daysRemaining: days, milestone })
    }

    let licEmailsSent = 0
    let licAlertsCount = 0
    for (const [tenantId, alerts] of Object.entries(licenceAlerts)) {
      const recipients = adminsByTenant[tenantId] || []
      if (!recipients.length) continue

      const rows = alerts.map(a =>
        tblRow(a.name,
          `${a.daysRemaining < 0 ? `<span style="color:${RED};font-weight:700">EXPIRED ${Math.abs(a.daysRemaining)} days ago</span>` : `<span style="color:${a.daysRemaining<=7?AMB:GRN};font-weight:700">${a.daysRemaining} day(s) remaining</span>`} · Expires: ${new Date(a.expiry_date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}`)
      ).join("")

      const hasExpired = alerts.some(a => a.daysRemaining < 0)
      const headerColor = hasExpired ? RED : AMB
      const subject = `Licence Alert — ${alerts.length} licence(s) require attention`

      const html = wrap(
        hdr(headerColor, "Licence Compliance Alert", `${alerts.length} licence(s) expiring or expired`) +
        body(`
          ${p("The following licences require attention:")}
          ${hl(hasExpired
            ? "⚠ One or more licences have already <strong>expired</strong>. Please renew immediately."
            : "⏰ One or more licences are approaching their expiry date. Please arrange renewal.",
            hasExpired ? RED : AMB,
            hasExpired ? RBG : ABG)}
          ${tbl(rows)}
          ${p("Log in to the Admin Console to update licence details and upload renewal documents.")}
          ${cta(ADMIN_APP_URL, "Go to Licences →", headerColor)}
        `)
      )

      const sent = await sendEmail(recipients, subject, html)
      if (sent) {
        licEmailsSent += recipients.length
        licAlertsCount += alerts.length
        for (const a of alerts) {
          await db.from("licences").update({ last_reminder_milestone: a.milestone }).eq("id", a.id)
        }
      }
    }

    // ── 4. RUN LOG ──────────────────────────────────────────────
    // One audit_log entry per tenant we checked, even when nothing was
    // sent — a missing entry for today is what signals a missed cron run.
    const allTenantIds = new Set([...Object.keys(adminsByTenant), ...Object.keys(itAdminsByTenant)])
    for (const tenantId of allTenantIds) {
      const docCount = (docAlerts[tenantId] || []).length
      const subCount = (subAlerts[tenantId] || []).length
      const licCount = (licenceAlerts[tenantId] || []).length
      await db.from("audit_log").insert([{
        tenant_id: tenantId,
        performed_by: null,
        action: "COMPLIANCE_ALERTS_RUN",
        target: null,
        detail: `Vehicle doc alerts due: ${docCount}. Subscription alerts due: ${subCount}. Licence alerts due: ${licCount}.`,
      }])
    }

    return new Response(
      JSON.stringify({
        success: true,
        doc_alerts: docAlertsCount,
        doc_emails_sent: docEmailsSent,
        sub_alerts: subAlertsCount,
        sub_emails_sent: subEmailsSent,
        licence_alerts: licAlertsCount,
        licence_emails_sent: licEmailsSent,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    )

  } catch (err: any) {
    console.error("compliance-alerts error:", err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }
})
