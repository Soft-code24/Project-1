import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { query, querySingle } from '../services/supabase.service.js'
import { sendSupportTicketAlert } from '../services/email.service.js'

export const createSupportTicket = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body

  if (!name || !name.trim()) throw ApiError.badRequest('Name is required.')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw ApiError.badRequest('Enter a valid email address.')
  if (!subject || !subject.trim()) throw ApiError.badRequest('Subject is required.')
  if (!message || !message.trim() || message.trim().length < 5)
    throw ApiError.badRequest('Please write a message (5+ characters).')

  const ticket = await querySingle(
    supabaseAdmin
      .from('support_tickets')
      .insert({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() })
      .select()
      .single(),
    'Could not create support ticket',
  )

  // Alert the owner (non-blocking)
  sendSupportTicketAlert(ticket).catch((err) => console.error('[email] support alert failed:', err.message))

  res.status(201).json({ ticket })
})

export const listSupportTickets = asyncHandler(async (req, res) => {
  const { status } = req.query
  let builder = supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
  if (status && status !== 'all') builder = builder.eq('status', status)
  const tickets = await query(builder, 'Could not load support tickets')
  res.json({ tickets })
})

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!status || !['open', 'replied', 'closed'].includes(status)) {
    throw ApiError.badRequest('Invalid status.')
  }
  const ticket = await querySingle(
    supabaseAdmin.from('support_tickets').update({ status }).eq('id', req.params.id).select().single(),
    'Ticket not found',
  )
  res.json({ ticket })
})

export const deleteSupportTicket = asyncHandler(async (req, res) => {
  await query(supabaseAdmin.from('support_tickets').delete().eq('id', req.params.id))
  res.json({ message: 'Ticket deleted' })
})
