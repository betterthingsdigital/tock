![](./images/tock-header.png)

Simple time reporting based on Google Calendar.

Add `config.json` containing the configuration for the CLI.
An example `config.json` is shown below. The `calendarUrl` is can be found
in your Google calendar's settings:

![Google Secret Calendar](./images/google-secret-calendar.png)

```json
{
  "members": [
    {
      "id": "jane",
      "name": "Jane Smith",
      "calendarUrl": "https://calendar.google.com/calendar/ical/.../basic.ics"
    },
    {
      "id": "jon",
      "name": "Jonathan Grey",
      "calendarUrl": "https://calendar.google.com/calendar/ical/.../basic.ics"
    }
  ]
}
```
