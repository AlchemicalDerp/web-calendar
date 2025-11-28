import { useMemo, useState } from 'react';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateValue(date) {
  return date.toISOString().split('T')[0];
}

function getCalendarDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < startDay; i += 1) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }
  return days;
}

function MonthNavigator({ currentMonth, onMonthChange }) {
  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const goToOffset = (offset) => {
    const updated = new Date(currentMonth);
    updated.setMonth(currentMonth.getMonth() + offset);
    onMonthChange(updated);
  };

  return (
    <div className="month-navigator">
      <button type="button" onClick={() => goToOffset(-1)} aria-label="Previous month">
        ◀
      </button>
      <h2>{monthName}</h2>
      <button type="button" onClick={() => goToOffset(1)} aria-label="Next month">
        ▶
      </button>
    </div>
  );
}

function EventForm({ onAddEvent }) {
  const today = formatDateValue(new Date());
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [details, setDetails] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !date) return;

    onAddEvent({
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      startTime,
      endTime,
      details: details.trim(),
    });

    setTitle('');
    setDate(today);
    setStartTime('09:00');
    setEndTime('10:00');
    setDetails('');
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h3>Create Event</h3>
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Team sync"
          required
        />
      </label>
      <div className="form-row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Start
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label>
          End
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>
      <label>
        Notes
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Agenda, location, links"
          rows="2"
        />
      </label>
      <button type="submit">Add to calendar</button>
    </form>
  );
}

function DayCell({ date, events }) {
  if (!date) {
    return <div className="day-cell empty" />;
  }

  const dateLabel = date.getDate();
  const dateKey = formatDateValue(date);
  const dayEvents = events.filter((event) => event.date === dateKey);

  return (
    <div className="day-cell">
      <div className="day-header">
        <span className="day-number">{dateLabel}</span>
        <span className="day-weekday">{dayLabels[date.getDay()]}</span>
      </div>
      <ul className="event-list">
        {dayEvents.length === 0 && <li className="empty-event">No events</li>}
        {dayEvents.map((event) => (
          <li key={event.id} className="event-chip">
            <div className="event-title">{event.title}</div>
            <div className="event-time">
              {event.startTime || 'All day'}
              {event.endTime ? ` – ${event.endTime}` : ''}
            </div>
            {event.details && <p className="event-notes">{event.details}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalendarGrid({ currentMonth, events }) {
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  return (
    <div className="calendar-grid">
      {dayLabels.map((label) => (
        <div key={label} className="day-label">
          {label}
        </div>
      ))}
      {calendarDays.map((date, index) => (
        <DayCell key={date?.toISOString() ?? `empty-${index}`} date={date} events={events} />
      ))}
    </div>
  );
}

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [events, setEvents] = useState([]);

  const handleAddEvent = (newEvent) => {
    setEvents((existing) => [...existing, newEvent]);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Function planner applet</p>
          <h1>Calendar & Organizer</h1>
        </div>
        <MonthNavigator currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
      </header>

      <main className="layout">
        <section className="panel">
          <EventForm onAddEvent={handleAddEvent} />
        </section>

        <section className="panel calendar-panel">
          <CalendarGrid currentMonth={currentMonth} events={events} />
        </section>
      </main>
    </div>
  );
}
