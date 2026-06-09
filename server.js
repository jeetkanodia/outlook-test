const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const { createEvents } = require("ics");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const calendars = {};

app.get("/api/calendars", (req, res) => {
  res.json(Object.values(calendars));
});

app.post("/api/calendars", (req, res) => {
  const calendar = {
    id: uuid(),
    name: req.body.name,
    events: []
  };

  calendars[calendar.id] = calendar;

  res.json(calendar);
});

app.post("/api/calendars/:id/events", (req, res) => {
  const cal = calendars[req.params.id];

  const event = {
    id: uuid(),
    ...req.body
  };

  cal.events.push(event);

  res.json(event);
});

app.put("/api/calendars/:id/events/:eventId", (req, res) => {
  const cal = calendars[req.params.id];

  const event = cal.events.find(
    e => e.id === req.params.eventId
  );

  Object.assign(event, req.body);

  res.json(event);
});

app.delete("/api/calendars/:id/events/:eventId", (req, res) => {
  const cal = calendars[req.params.id];

  cal.events = cal.events.filter(
    e => e.id !== req.params.eventId
  );

  res.json({ success: true });
});

app.get("/calendar/:id.ics", (req, res) => {
  const cal = calendars[req.params.id];

  if (!cal) {
    return res.status(404).send();
  }

  const events = cal.events.map(e => ({
    title: e.title,
    description: e.description,
    start: [
      e.year,
      e.month,
      e.day,
      e.hour,
      e.minute
    ],
    duration: {
      hours: 1
    }
  }));

  createEvents(events, (err, value) => {
    res.setHeader("Content-Type", "text/calendar");
    res.send(value);
  });
});

app.listen(3000, () => {
  console.log("running on 3000");
});