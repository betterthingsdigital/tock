const fetch = require('node-fetch')
const ICAL = require('ical.js')
const moment = require('moment')
const ora = require('ora')
const config = require('../config.json')

const fetchAll = async () => {
  let events = []
  for (let member of config.members) {
    const task = ora({ text: `fetching ${member.name}'s calendar`, color: 'black' }).start()
    try {
      const memberEvents = await fetchCalendar(member.calendarUrl, {
        member: member.id,
      })
      events = [...events, ...memberEvents]
      task.succeed(`fetched ${memberEvents.length} events for ${member.name}`)
    } catch (e) {
      task.fail(`failed to fetch ${member.name}'s calendar`)
    }
  }
  return events
}

const fetchCalendar = async (calendarUrl, additionalData) => {
  if (!calendarUrl) {
    throw new Error(`calendarUrl is required, got ${calendarUrl}`)
  }
  const response = await fetch(calendarUrl)
  const text = await response.text()
  const icalData = ICAL.parse(text)
  const ical = new ICAL.Component(icalData)
  const events = ical.getAllSubcomponents('vevent')

  return buildEventsList(events, additionalData)
}

const buildEventsList = (events, additionalData) => {
  return events.map(e => {
    const event = new ICAL.Event(e)
    // <project>:<story> [comment]
    const summary = event.summary
    const [, project] = summary.match(/(.*):/) || []
    const [, story] = summary.match(/.*:(\S+)/) || []
    const [, comment] = summary.match(/.*:\S*\s*(.*)/) || []
    const duration = (eventStart, eventEnd) => {
      const start = moment(eventStart)
      const end = moment(eventEnd)
      const diff = end.diff(start, 'hours', true)
      return diff
    }
    return {
      project: (project && project.trim()) || '',
      story: (story && story.trim()) || '',
      get gid() {
        return `${this.project}:${this.story}`
      },
      comment: (comment && comment.trim()) || '',
      start: event.startDate.toString(),
      end: event.endDate.toString(),
      get duration() {
        return duration(this.start, this.end)
      },
      // Apple Numbers expects commas instead of dots
      get durationStr() {
        return this.duration.toFixed(2).replace('.', ',')
      },
      uid: event.uid,
      ...(additionalData || {}),
    }
  })
}

module.exports = { fetchAll }
