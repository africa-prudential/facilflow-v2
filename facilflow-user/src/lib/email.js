import { supabase } from './supabase.js'

// ── sendEmail ──────────────────────────────────────────────
// Calls the Supabase Edge Function which sends via Resend
// template: one of the keys in the edge function templates object
// to: email string or array of emails
// data: template variables object

export const sendEmail = async (template, to, data) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { template, to, data }
    })
    if (error) throw error
    return result
  } catch (err) {
    console.error('Email error:', err)
    return { error: err }
  }
}

// ── SHORTHAND HELPERS ──────────────────────────────────────

const APP_URL = window.location.origin
const crUrl = cr => `${APP_URL}/change_requests?cr=${cr.id}`

export const emailCRSubmitted = (toEmails, cr, raisedBy) =>
  sendEmail('cr_submitted', toEmails, {
    cr_id: cr.id,
    title: cr.title,
    change_type: cr.changeType || cr.change_type,
    risk_level: cr.riskLevel || cr.risk_level,
    raised_by: raisedBy,
    deploy_date: cr.deployDate || cr.deploy_date,
    app_url: crUrl(cr),
  })

export const emailCRScheduled = (toEmails, cr) =>
  sendEmail('cr_scheduled', toEmails, {
    cr_id: cr.id,
    title: cr.title,
    deploy_date: cr.deployDate || cr.deploy_date,
    deploy_start: cr.deployStart || cr.deploy_start,
    deploy_end: cr.deployEnd || cr.deploy_end,
    environment: cr.environment,
    app_url: crUrl(cr),
  })

export const emailCRReminder = (toEmails, cr, raisedBy, submittedDate) =>
  sendEmail('cr_reminder', toEmails, {
    cr_id: cr.id,
    title: cr.title,
    raised_by: raisedBy,
    submitted_date: submittedDate,
    app_url: crUrl(cr),
  })

export const emailCRReviewerAdded = (toEmails, cr, raisedBy) =>
  sendEmail('cr_stage_notification', toEmails, {
    cr_id: cr.id,
    title: cr.title,
    stage: 'Added as Reviewer',
    subject: `You've been added as a reviewer on ${cr.id} — ${cr.title}`,
    action: `Hi, ${raisedBy} has added you as a reviewer on this change request. Your review is advisory — feel free to leave a comment or concur, but it will not block the approval process.`,
    app_url: crUrl(cr),
  })

export const emailCRLineManagerReview = (toEmails, cr, raisedBy) =>
  sendEmail('cr_stage_notification', toEmails, {
    cr_id: cr.id,
    title: cr.title,
    stage: 'Line Manager Review',
    subject: `Action required: ${cr.id} needs your review — ${cr.title}`,
    action: `${raisedBy} submitted a change request from your department and it requires your review before it proceeds to the Change Manager.`,
    app_url: crUrl(cr),
  })

export const emailCRNoManagerConfigured = (toEmails, cr, raisedBy) =>
  sendEmail('cr_stage_notification', toEmails, {
    cr_id: cr.id,
    title: cr.title,
    stage: 'Action Required — No Change Manager Configured',
    subject: `Action required: ${cr.id} has no Change Manager to route to`,
    action: `${raisedBy} submitted change request ${cr.id} ("${cr.title}"), but no Change Manager is configured for this tenant, so it cannot move forward. Go to Admin → CR Policy to assign one.`,
    app_url: 'https://admin-facilflow.africaprudential.com',
  })

export const emailUserInvitation = (toEmail, role, inviteUrl) =>
  sendEmail('user_invitation', toEmail, {
    role,
    invite_url: inviteUrl,
  })

export const emailRequestApproved = (toEmail, req, type, approver) =>
  sendEmail('request_approved', toEmail, {
    title: req.title,
    type,
    approver,
    app_url: APP_URL,
  })

export const emailTicketCreated = (toEmails, ticket, raisedBy) =>
  sendEmail('ticket_created', toEmails, {
    ticket_id: ticket.id,
    subject: ticket.subject,
    type: ticket.type === 'incident' ? 'Incident' : 'Service Request',
    priority: ticket.priority || 'medium',
    category: [ticket.category, ticket.subcategory, ticket.item].filter(Boolean).join(' › ') || '—',
    department: ticket.department || '—',
    description: (ticket.description || '').slice(0, 400),
    raised_by: raisedBy,
    app_url: APP_URL,
  })

export const emailTicketComment = (toEmails, ticket, commenterName, commentBody) =>
  sendEmail('ticket_comment', toEmails, {
    ticket_id: ticket.id,
    subject: ticket.subject,
    commenter: commenterName,
    comment: commentBody.slice(0, 600),
    app_url: APP_URL,
  })

export const emailTicketReceived = (toEmail, ticket) =>
  sendEmail('ticket_received', toEmail, {
    ticket_id: ticket.id,
    subject: ticket.subject,
    type: ticket.type === 'incident' ? 'Incident' : 'Service Request',
    priority: ticket.priority || 'medium',
    app_url: APP_URL,
  })

export const emailTicketStatusUpdate = (toEmail, ticket, newStatus, updatedBy) =>
  sendEmail('ticket_status_update', toEmail, {
    ticket_id: ticket.id,
    subject: ticket.subject,
    new_status: newStatus,
    updated_by: updatedBy,
    app_url: APP_URL,
  })
