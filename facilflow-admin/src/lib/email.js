import { supabase, USER_APP_URL } from './supabase.js'

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
    // Don't throw — email failure should never block the UI action
  }
}

// ── SHORTHAND HELPERS ──────────────────────────────────────

const APP_URL = window.location.origin

export const emailUserInvitation = (toEmail, role, inviteUrl) =>
  sendEmail('user_invitation', toEmail, {
    role,
    invite_url: inviteUrl,
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

export const emailTicketAssigned = (toEmail, ticket, assignedBy) =>
  sendEmail('ticket_assigned', toEmail, {
    ticket_id: ticket.id,
    subject: ticket.subject || ticket.title,
    priority: ticket.priority || 'medium',
    assigned_by: assignedBy,
    app_url: APP_URL,
  })

// Both sent to the ticket's original requester — a Staff Portal user, not an
// Admin Console user — so these use USER_APP_URL, not the local APP_URL
// (window.location.origin, which resolves to the Admin Console here).
export const emailTicketStatusUpdate = (toEmail, ticket, newStatus, updatedBy) =>
  sendEmail('ticket_status_update', toEmail, {
    ticket_id: ticket.id,
    subject: ticket.subject || ticket.title,
    new_status: newStatus,
    updated_by: updatedBy,
    app_url: USER_APP_URL,
  })

export const emailTicketComment = (toEmails, ticket, commenterName, commentBody) =>
  sendEmail('ticket_comment', toEmails, {
    ticket_id: ticket.id,
    subject: ticket.subject || ticket.title,
    commenter: commenterName,
    comment: commentBody.slice(0, 600),
    app_url: USER_APP_URL,
  })
