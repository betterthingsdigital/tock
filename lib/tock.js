const fs = require('fs')
const { resolve } = require('path')
const program = require('commander')
const moment = require('moment')
const fetch = require('node-fetch')
const ora = require('ora')
const { version } = require('../package.json')
const config = require('../config.json')
const Calendar = require('./calendar')
const Report = require('./report')

const REPORTS_DIR = resolve(__dirname, '..', 'reports')
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR)
}

program.version(version)

program
  .command('members')
  .description('lists all team members')
  .action((cmd, env) => {
    config.members.map(m => {
      console.log(`• ${m.name} (${m.id})`)
    })
  })

program
  .command('reports')
  .description('lists all generated reports')
  .action((cmd, env) => {
    const files = fs.readdirSync(REPORTS_DIR)
    files.forEach(f => console.log(`./reports/${f}`))
  })

program
  .command('report')
  .description('create a report with the specified filters')
  .option('-p, --project [project]', 'which project (defaults to all)')
  .option('-m, --member [member]', 'which member (defaults to all)')
  .option('-s, --story [story]', 'which story (defaults to all)')
  .option('-f, --from [from]', 'start date (YYYY-MM-DD - defaults to start of previous month)')
  .option('-t, --to [to]', 'to date (YYYY-MM-DD - defaults to end of previous month)')
  .option('-o, --out [out]', 'report file name')
  .option('--summary', 'summarize the report')
  .option('--enrich', 'enrich summarized stories')
  .option('--override', 'override the report if it already exists')
  .action(async ({ project, member, story, from, to, out, override, summary, enrich }) => {
    const events = await Calendar.fetchAll()
    const report = Report.fromEvents(events, { project, member, story, from, to, out, override })

    let columns = []
    let data = []

    if (summary) {
      report.summarize()

      if (enrich) {
        const trelloData = {}
        for (let p of config.projects) {
          if (p.boardId) {
            const res = await fetch(
              `https://api.trello.com/1/boards/${p.boardId}/cards?key=${config.trello.key}&token=${
                config.trello.token
              }`,
            )
            const data = await res.json()
            trelloData[p.id] = data
          }
        }
        report.enrich(trelloData)
      }

      columns = [
        { field: 'gid', header: 'ID' },
        { field: 'project', header: 'Project' },
        { field: 'story', header: 'Story' },
        { field: 'durationStr', header: 'Duration' },
      ]
      if (enrich) {
        columns.push({ field: 'title', header: 'Title' })
      }
      data = report.summary
    } else {
      columns = [
        { field: 'gid', header: 'ID' },
        { field: 'project', header: 'Project' },
        { field: 'story', header: 'Story' },
        { field: 'member', header: 'Member' },
        { field: 'start', header: 'Start' },
        { field: 'end', header: 'End' },
        { field: 'durationStr', header: 'Duration' },
        { field: 'comment', header: 'Comment' },
      ]
      data = report.events
    }

    const savingTask = ora({ color: 'black', text: 'exporting the report as csv' }).start()

    const header = columns.map(({ header }) => `"${header}"`).join(',')
    const rows = data.map(event => columns.map(({ field }) => `"${event[field]}"`).join(','))
    const csv = [header, ...rows].join('\n')
    const filename = out || `${moment().format('YYYY-MM-DD--HH-mm-ss')}.csv`
    const filePath = resolve(REPORTS_DIR, filename)
    try {
      if (!override && fs.existsSync(filePath)) {
        return savingTask.fail(`file ${filePath} already exists`)
      }
      fs.writeFileSync(filePath, csv)
      savingTask.succeed(`report was written to ${filePath}`)
    } catch (e) {
      savingTask.fail(`writing the report failed ${e.message}`)
    }
  })

program.command('*').action(() => program.help())

program.parse(process.argv)

if (process.argv.length <= 2) {
  program.help()
}
