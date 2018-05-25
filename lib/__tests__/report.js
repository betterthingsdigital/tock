const moment = require('moment')
const Report = require('../report')
const events = require('./events.json')

describe('report', () => {
  describe('compile', () => {
    describe('project filter', () => {
      it('filters events for the specified project', () => {
        const r = Report.fromEvents(events, { project: 'a', from: '2018-04-01', to: '2018-04-30' })
        expect(r.events).toEqual([events[0], events[2]])
      })

      it('allows all projects if no project is specified', () => {
        const r = Report.fromEvents(events, { from: '2018-04-01', to: '2018-04-30' })
        expect(r.events).toEqual(events)
      })
    })

    describe('member filter', () => {
      it('filters events for the specified member', () => {
        const r = Report.fromEvents(events, { member: 'x', from: '2018-04-01', to: '2018-04-30' })
        expect(r.events).toEqual([events[0], events[1]])
      })

      it('allows all members if no member is specified', () => {
        const r = Report.fromEvents(events, { from: '2018-04-01', to: '2018-04-30' })
        expect(r.events).toEqual(events)
      })
    })

    describe('story filter', () => {
      it('filters events for the specified story', () => {
        const r = Report.fromEvents(events, { story: '42', from: '2018-04-01', to: '2018-04-30' })
        expect(r.events).toEqual([events[0], events[1]])
      })

      it('allows all stories if no story is specified', () => {
        const r = Report.fromEvents(events, { from: '2018-04-01', to: '2018-04-30' })
        expect(r.events).toEqual(events)
      })
    })

    describe('combined filters', () => {
      it('correctly filters project and story', () => {
        const r = Report.fromEvents(events, {
          project: 'a',
          story: '42',
          from: '2018-04-01',
          to: '2018-04-30',
        })
        expect(r.events).toEqual([events[0]])
      })

      it('correctly filters project and member', () => {
        const r = Report.fromEvents(events, {
          project: 'a',
          member: 'y',
          from: '2018-04-01',
          to: '2018-04-30',
        })
        expect(r.events).toEqual([events[2]])
      })
    })

    describe('from/to filter', () => {
      it('default filters events for previous month', () => {
        const PREVIOUS_MONTH = moment()
          .startOf('month')
          .subtract(1, 'month')
          .add(2, 'days')
          .format('YYYY-MM-DD')
        const NEXT_MONTH = moment()
          .startOf('month')
          .add(1, 'month')
          .add(2, 'days')
          .format('YYYY-MM-DD')
        const previousMonth = events.slice(0, 1).map(event => ({
          ...event,
          start: `${PREVIOUS_MONTH}T08:00:00`,
          end: `${PREVIOUS_MONTH}T09:00:00`,
        }))
        const nextMonth = events.slice(1, 2).map(event => ({
          ...event,
          start: `${NEXT_MONTH}T08:00:00`,
          end: `${NEXT_MONTH}T:09:00:00`,
        }))
        const r = Report.fromEvents([...previousMonth, ...nextMonth], {})
        expect(r.events).toEqual([...previousMonth])
      })
    })
  })
})
