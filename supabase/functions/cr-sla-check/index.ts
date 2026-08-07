import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── Schedule this function in Supabase Dashboard → Edge Functions → Cron ──
// Cron expression: */30 * * * *   (every 30 minutes)

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY      = Deno.env.get("RESEND_API_KEY") ?? ""
const FROM_EMAIL          = "noreply@facilflow.africaprudential.com"
const FROM_NAME           = "FaciliFlow — Africa Prudential"
const APP_URL             = Deno.env.get("APP_URL") ?? "https://facilflow.africaprudential.com"

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

const LOGO = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="${B}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="#fff">AP</text></svg>`

function wrap(inner: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FaciliFlow</title></head>
<body style="margin:0;padding:0;background:${BG}">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:#fff;border-radius:12px;border:1px solid ${BDR};overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
${inner}
</td></tr>
<tr><td style="padding:20px 0;text-align:center">
<div style="font-family:Arial,sans-serif;font-size:11px;color:${MUT};margin-bottom:4px"><strong style="color:${INK}">Africa Prudential Plc</strong> · FaciliFlow Change Management</div>
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

async function sendEmail(to: string[], subject: string, html: string, cc?: string[]) {
  if (!to.length) return false
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, cc, subject, html }),
  })
  if (!res.ok) {
    const err = await res.json()
    console.error("Resend error:", JSON.stringify(err))
  }
  return res.ok
}

const TERMINAL_STATUSES = ["rejected", "completed", "failed", "closed"]

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const now = new Date()

    const { data: crs } = await db
      .from("change_requests")
      .select("*")
      .not("status", "in", `(${TERMINAL_STATUSES.join(",")})`)

    const { data: levels } = await db.from("change_approval_levels").select("*")
    const { data: tenantConfigs } = await db.from("change_tenant_config").select("*")
    const { data: allUsers } = await db.from("users").select("id,email,name,tenant_id")
    const { data: allUserRoles } = await db.from("user_change_roles").select("user_id,role_key,tenant_id")

    const tenantConfigById: Record<string, any> = {}
    for (const tc of tenantConfigs || []) tenantConfigById[tc.tenant_id] = tc

    const usersById: Record<string, any> = {}
    for (const u of allUsers || []) usersById[u.id] = u

    const emailsForRole = (tenantId: string, roleKey: string): string[] => {
      const userIds = (allUserRoles || [])
        .filter(r => r.tenant_id === tenantId && r.role_key === roleKey)
        .map(r => r.user_id)
      return userIds.map(id => usersById[id]?.email).filter(Boolean)
    }

    let reminders = 0
    let escalations = 0

    for (const cr of crs || []) {
      if (!cr.stage_entered_at) continue

      let slaHours: number | null = null
      let reminderBeforeMinutes: number | null = null
      let stageLabel = cr.current_stage
      let recipientEmails: string[] = []

      const tc = tenantConfigById[cr.tenant_id]

      if (cr.current_stage === "pending_manager") {
        slaHours = tc?.manager_sla_hours ?? null
        reminderBeforeMinutes = tc?.manager_reminder_before_minutes ?? null
        stageLabel = "Change Manager Review"
        const mgr = cr.change_manager_id ? usersById[cr.change_manager_id] : null
        if (mgr?.email) recipientEmails = [mgr.email]
      } else if (cr.current_stage === "pending_implementation") {
        slaHours = tc?.implementation_sla_hours ?? null
        reminderBeforeMinutes = tc?.implementation_reminder_before_minutes ?? null
        stageLabel = "Implementation"
        recipientEmails = emailsForRole(cr.tenant_id, "change_implementer")
      } else {
        const match = cr.current_stage?.match(/^pending_level_(\d+)$/)
        if (match) {
          const levelNum = Number(match[1])
          const level = (levels || []).find(l => l.tenant_id === cr.tenant_id && l.level_order === levelNum)
          if (level) {
            slaHours = level.sla_hours ?? null
            reminderBeforeMinutes = level.reminder_before_minutes ?? null
            stageLabel = level.name || `Level ${levelNum} Approval`
            recipientEmails = emailsForRole(cr.tenant_id, level.role_key)
          }
        }
      }

      if (slaHours == null) continue // no SLA configured for this stage — skip

      const elapsedHours = (now.getTime() - new Date(cr.stage_entered_at).getTime()) / 3600000

      if (elapsedHours >= slaHours && !cr.escalated_at) {
        const escalationAuthorityId = tc?.escalation_authority_id || tc?.change_manager_id
        const escalationUser = escalationAuthorityId ? usersById[escalationAuthorityId] : null
        const to = escalationUser?.email ? [escalationUser.email] : []
        const cc = tc?.escalation_cc_email ? [tc.escalation_cc_email] : undefined

        if (to.length || cc?.length) {
          const html = wrap(
            hdr(RED, "Change Request Escalation", `${stageLabel} is overdue`) + body(`
              ${p(`A change request has exceeded its configured SLA and requires immediate attention.`)}
              ${hl(`⚠ Overdue by <strong>${Math.round(elapsedHours - slaHours)} hour(s)</strong> at stage <strong>${stageLabel}</strong>.`, RED, RBG)}
              ${tbl(
                tblRow("Change Code", cr.id) +
                tblRow("Title", cr.title) +
                tblRow("Current Stage", stageLabel) +
                tblRow("SLA", `${slaHours} hour(s)`)
              )}
              ${cta(`${APP_URL}/change_requests?cr=${cr.id}`, "Review Change Request →", RED)}
            `)
          )
          const sent = await sendEmail(to, `ESCALATION: ${cr.id} — ${stageLabel} overdue`, html, cc)
          if (sent) {
            await db.from("change_requests").update({ escalated_at: now.toISOString() }).eq("id", cr.id)
            await db.from("audit_log").insert([{
              tenant_id: cr.tenant_id,
              performed_by: null,
              action: "CR_ESCALATED",
              target: cr.id,
              detail: `${stageLabel} overdue by ${Math.round(elapsedHours - slaHours)}h — escalated to ${escalationUser?.name || escalationUser?.email || "escalation authority"}`,
            }])
            escalations++
          }
        }
      } else if (
        reminderBeforeMinutes != null &&
        elapsedHours >= (slaHours - reminderBeforeMinutes / 60) &&
        !cr.reminder_sent_at
      ) {
        if (recipientEmails.length) {
          const html = wrap(
            hdr(AMB, "Approval Reminder", `${stageLabel} is awaiting action`) + body(`
              ${p("This is a reminder that the following change request is still awaiting your action.")}
              ${hl(`⏳ Pending for <strong>${Math.round(elapsedHours)} hour(s)</strong> — SLA is ${slaHours}h. Please review at your earliest convenience.`, AMB, ABG)}
              ${tbl(
                tblRow("Change Code", cr.id) +
                tblRow("Title", cr.title) +
                tblRow("Current Stage", stageLabel)
              )}
              ${cta(`${APP_URL}/change_requests?cr=${cr.id}`, "Review & Approve Now →", AMB)}
            `)
          )
          const sent = await sendEmail(recipientEmails, `Reminder: ${cr.id} is awaiting your approval — FaciliFlow`, html)
          if (sent) {
            await db.from("change_requests").update({ reminder_sent_at: now.toISOString() }).eq("id", cr.id)
            await db.from("audit_log").insert([{
              tenant_id: cr.tenant_id,
              performed_by: null,
              action: "CR_REMINDER_SENT",
              target: cr.id,
              detail: `Reminder sent for ${stageLabel}, pending ${Math.round(elapsedHours)}h`,
            }])
            reminders++
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, checked: (crs || []).length, reminders, escalations }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    )

  } catch (err: any) {
    console.error("cr-sla-check error:", err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }
})
