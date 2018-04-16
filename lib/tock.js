const fs = require('fs')
const { resolve } = require('path')
const program = require('commander')
const moment = require('moment')
const { version } = require('../package.json')
const config = require('../config.json')
const ora = require('ora')
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
  .option('--override', 'override the report if it already exists')
  .action(async ({ project, member, story, from, to, out, override }) => {
    const events = await Calendar.fetchAll()
    const report = Report.compile(events, { project, member, story, from, to, out, override })

    const savingTask = ora({ color: 'black', text: 'exporting the report as csv' }).start()

    const csvConfig = [
      { field: 'gid', header: 'ID' },
      { field: 'project', header: 'Project' },
      { field: 'story', header: 'Story' },
      { field: 'member', header: 'Member' },
      { field: 'start', header: 'Start' },
      { field: 'end', header: 'End' },
      { field: 'durationStr', header: 'Duration' },
      { field: 'comment', header: 'Comment' },
    ]

    const header = csvConfig.map(({ header }) => `"${header}"`).join(',')
    const data = report.map(event => csvConfig.map(({ field }) => `"${event[field]}"`).join(','))
    const csv = [header, ...data].join('\n')
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
