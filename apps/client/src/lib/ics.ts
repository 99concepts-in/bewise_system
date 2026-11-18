/**
 * @module scheduling-ux @owner CLIENT @screens CL-17, CL-19, CL-58 Add to calendar
 * Purpose: build an .ics file (Apple/Outlook/any) and a Google Calendar link for a session.
 */
const z = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
export function sessionIcs(o: { id: string; title: string; start: string; minutes: number; location: string; description: string }) {
  const s = new Date(o.start), e = new Date(s.getTime() + o.minutes * 60_000)
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BeWise//Client//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${o.id}@bewise`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(s)}`, `DTEND:${z(e)}`,
    `SUMMARY:${o.title}`, `LOCATION:${o.location}`, `DESCRIPTION:${o.description}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Your BeWise session starts in 30 minutes', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}
export function downloadIcs(name: string, ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000)
}
export function googleCalUrl(o: { title: string; start: string; minutes: number; location: string; description: string }) {
  const s = new Date(o.start), e = new Date(s.getTime() + o.minutes * 60_000)
  const p = new URLSearchParams({ action: 'TEMPLATE', text: o.title, dates: `${z(s)}/${z(e)}`, location: o.location, details: o.description })
  return `https://calendar.google.com/calendar/render?${p}`
}
