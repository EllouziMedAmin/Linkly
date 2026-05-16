/**
 * Lyncly — .ics Calendar File Generator
 * Generates standard iCalendar files that work with
 * Google Calendar, Apple Calendar, Outlook, and all major calendar apps.
 */

/**
 * Formats a JS Date to iCalendar YYYYMMDDTHHMMSSZ format (UTC).
 */
function formatDate(date) {
  if (!date) return null
  const d = new Date(date)
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Formats a JS Date to YYYYMMDD (all-day event).
 */
function formatDateOnly(date) {
  if (!date) return null
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

/**
 * Escapes special characters in iCalendar text fields.
 */
function escapeText(text) {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generates a unique UID for the calendar event.
 */
function generateUID() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@lyncly.app`
}

/**
 * Generate and trigger download of an .ics calendar file.
 *
 * @param {Object} options
 * @param {string} options.title - Event title
 * @param {string} options.description - Event description
 * @param {string|Date} options.startDate - Event start date
 * @param {string|Date} [options.endDate] - Event end date (defaults to startDate + 1 day)
 * @param {string} [options.location] - Event location
 * @param {boolean} [options.allDay=true] - Whether it's an all-day event
 * @param {number} [options.reminderMinutes=1440] - Reminder in minutes before event (default: 24h)
 * @param {string} [options.organizer] - Organizer name
 */
export function downloadCalendarEvent({
  title,
  description = '',
  startDate,
  endDate,
  location = '',
  allDay = true,
  reminderMinutes = 1440,
  organizer = 'Lyncly'
}) {
  if (!startDate) {
    alert('This programme has no date set yet.')
    return
  }

  const uid = generateUID()
  const now = formatDate(new Date())
  
  let dtStart, dtEnd

  if (allDay) {
    dtStart = formatDateOnly(startDate)
    dtEnd = endDate ? formatDateOnly(endDate) : formatDateOnly(new Date(new Date(startDate).getTime() + 86400000))
  } else {
    dtStart = formatDate(startDate)
    dtEnd = endDate ? formatDate(endDate) : formatDate(new Date(new Date(startDate).getTime() + 3600000))
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lyncly//Programme Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    location ? `LOCATION:${escapeText(location)}` : null,
    `ORGANIZER;CN=${escapeText(organizer)}:MAILTO:noreply@lyncly.app`,
    `STATUS:CONFIRMED`,
    // Reminder / Alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT' + reminderMinutes + 'M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${escapeText(title)} is coming up!`,
    'END:VALARM',
    // Second reminder — 1 hour before
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)} starts in 1 hour!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean)

  const icsContent = lines.join('\r\n')
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Helper: Generate a programme calendar event from a programme object.
 */
export function downloadProgrammeCalendar(programme) {
  downloadCalendarEvent({
    title: programme.title,
    description: [
      programme.description,
      '',
      programme.deadline ? `Application Deadline: ${new Date(programme.deadline).toLocaleDateString()}` : '',
      '',
      'Powered by Lyncly — Programmable Ecosystem Linkages'
    ].filter(Boolean).join('\n'),
    startDate: programme.start_date || programme.deadline,
    endDate: programme.end_date,
    location: programme.location || '',
    allDay: true,
    reminderMinutes: 1440,
    organizer: 'Lyncly'
  })
}

/**
 * Helper: Generate a deadline reminder calendar event.
 */
export function downloadDeadlineReminder(programme) {
  if (!programme.deadline) {
    alert('This programme has no deadline set.')
    return
  }

  downloadCalendarEvent({
    title: `⏰ Deadline: ${programme.title}`,
    description: [
      `Application deadline for "${programme.title}".`,
      '',
      `Don't forget to submit your application before this date!`,
      '',
      'Powered by Lyncly'
    ].join('\n'),
    startDate: programme.deadline,
    allDay: true,
    reminderMinutes: 2880, // 48 hours before
    organizer: 'Lyncly'
  })
}

/**
 * Helper: Generate a calendar invite for a mentor-participant introduction session.
 */
export function downloadMatchSession(mentorName, participantName, programmeTitle) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0) // Default to 10 AM tomorrow

  downloadCalendarEvent({
    title: `🤝 Intro Session: ${participantName} x ${mentorName}`,
    description: [
      `Introduction session for the "${programmeTitle}" programme.`,
      '',
      `Mentor: ${mentorName}`,
      `Participant: ${participantName}`,
      '',
      'Agenda:',
      '1. Introductions',
      '2. Programme goals alignment',
      '3. Schedule next sessions',
      '',
      'Powered by Lyncly — Programmable Ecosystem Linkages'
    ].join('\n'),
    startDate: tomorrow,
    endDate: new Date(tomorrow.getTime() + 3600000), // 1 hour duration
    allDay: false,
    reminderMinutes: 30,
    organizer: 'Lyncly'
  })
}
