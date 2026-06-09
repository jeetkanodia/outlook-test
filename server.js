const express = require("express");
const { randomUUID } = require("crypto");

const app = express();

app.use(express.json());

const calendars = {};

// Serve UI
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

/*
|--------------------------------------------------------------------------
| CALENDARS
|--------------------------------------------------------------------------
*/

app.get("/api/calendars", (req, res) => {
  res.json(Object.values(calendars));
});

app.post("/api/calendars", (req, res) => {
  const calendar = {
    id: randomUUID(),
    name: req.body.name,
    events: []
  };

  calendars[calendar.id] = calendar;

  res.json(calendar);
});

/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

app.post("/api/calendars/:id/events", (req, res) => {
  const cal = calendars[req.params.id];

  if (!cal) {
    return res.status(404).json({
      error: "calendar not found"
    });
  }

  const event = {
    id: randomUUID(),
    title: req.body.title,
    description: req.body.description || "",
    start: req.body.start,
    end: req.body.end,
    sequence: 0,
    updatedAt: new Date().toISOString()
  };

  cal.events.push(event);

  res.json(event);
});

app.put("/api/calendars/:id/events/:eventId", (req, res) => {
  const cal = calendars[req.params.id];

  const event = cal.events.find(
    e => e.id === req.params.eventId
  );

  if (!event) {
    return res.status(404).json({
      error: "event not found"
    });
  }

  event.title = req.body.title;
  event.description = req.body.description;
  event.start = req.body.start;
  event.end = req.body.end;

  event.sequence++;
  event.updatedAt = new Date().toISOString();

  res.json(event);
});

app.delete("/api/calendars/:id/events/:eventId", (req, res) => {
  const cal = calendars[req.params.id];

  cal.events = cal.events.filter(
    e => e.id !== req.params.eventId
  );

  res.json({
    success: true
  });
});

/*
|--------------------------------------------------------------------------
| ICS FEED
|--------------------------------------------------------------------------
*/

function formatICSDate(dateString) {
  const d = new Date(dateString);

  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+/g, "");
}

app.get("/calendar/:id.ics", (req, res) => {
  const cal = calendars[req.params.id];

  if (!cal) {
    return res.status(404).send("calendar not found");
  }

  let ics = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${cal.name}
`;

  cal.events.forEach(event => {
    ics += `
BEGIN:VEVENT
UID:${event.id}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
DTSTAMP:${formatICSDate(event.updatedAt)}
LAST-MODIFIED:${formatICSDate(event.updatedAt)}
SEQUENCE:${event.sequence}
DTSTART:${formatICSDate(event.start)}
DTEND:${formatICSDate(event.end)}
END:VEVENT
`;
  });

  ics += `
END:VCALENDAR
`;

  res.setHeader("Content-Type", "text/calendar");
  res.send(ics);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`running on ${PORT}`);
});
