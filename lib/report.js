const moment = require('moment')

const compile = (events, { project, member, story, from, to, out, override }) => {
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

  return filteredEvents.filter(fromFilter).filter(toFilter)
}

module.exports = { compile }
