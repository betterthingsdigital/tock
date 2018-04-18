const moment = require('moment')
const groupBy = require('lodash.groupby')

class Report {
  static fromEvents(events, { project, member, story, from, to, out, override }) {
    const arrayify = str =>
      str
        .split(',')
        .map(v => v.trim())
        .map(v => v.toLowerCase())
        .filter(v => v)

    let filteredEvents = [...events]

    if (project) {
      const projects = arrayify(project)
      const projectFilter = event => projects.includes(event.project.toLowerCase())
      filteredEvents = filteredEvents.filter(projectFilter)
    }

    if (story) {
      const stories = arrayify(story)
      const storyFilter = event => stories.includes(event.story.toLowerCase())
      filteredEvents = filteredEvents.filter(storyFilter)
    }

    if (member) {
      const members = arrayify(member)
      const memberFilter = event => members.includes(event.member)
      filteredEvents = filteredEvents.filter(memberFilter)
    }

    const START_OF_LAST_MONTH = moment()
      .startOf('month')
      .subtract(1, 'month')
      .format('YYYY-MM-DD')

    const END_OF_LAST_MONTH = moment()
      .endOf('month')
      .subtract(1, 'month')
      .format('YYYY-MM-DD')

    const fromDate = from || START_OF_LAST_MONTH
    const fromFilter = event => event.start >= fromDate

    const toDate = to || END_OF_LAST_MONTH
    const toFilter = event => event.end <= toDate

    return new Report(filteredEvents.filter(fromFilter).filter(toFilter))
  }

  constructor(events) {
    this._events = events
    this._summary = []
  }

  get events() {
    return this._events
  }

  get summary() {
    return this._summary
  }

  summarize() {
    const groupedEvents = groupBy(this._events, 'gid')
    const summarizedEvents = Object.keys(groupedEvents).map(gid => ({
      gid,
      project: groupedEvents[gid][0].project,
      story: groupedEvents[gid][0].story,
      durationStr: groupedEvents[gid]
        .reduce((sum, current) => sum + current.duration, 0)
        .toFixed(2)
        .replace('.', ','),
    }))
    this._summary = summarizedEvents
  }

  enrich(data) {
    if (!this._summary) {
      throw new Error('can only enrich summarized data')
    }
    this._summary = this._summary.map(s => {
      const projectData = (data && data[s.project]) || []
      const story = projectData.find(e => e.idShort == s.story)
      const storyTitle = (story && story.name) || ''
      return { ...s, title: storyTitle }
    })
  }
}

module.exports = Report
