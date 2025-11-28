import { useEffect, useMemo, useState } from 'react';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateValue(date) {
  return date.toISOString().split('T')[0];
}

const regionalHolidays = {
  '2025-01-01': [{ name: "New Year's Day", region: 'US' }],
  '2025-07-04': [{ name: 'Independence Day', region: 'US' }],
  '2025-11-27': [{ name: 'Thanksgiving Day', region: 'US' }],
  '2025-12-25': [{ name: 'Christmas Day', region: 'US' }],
  '2024-12-25': [{ name: 'Christmas Day', region: 'US' }],
  '2024-11-28': [{ name: 'Thanksgiving Day', region: 'US' }],
  '2024-07-04': [{ name: 'Independence Day', region: 'US' }],
};

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

  const [pickerValue, setPickerValue] = useState(() => formatDateValue(currentMonth).slice(0, 7));

  useEffect(() => {
    setPickerValue(formatDateValue(currentMonth).slice(0, 7));
  }, [currentMonth]);

  const goToOffset = (offset) => {
    const updated = new Date(currentMonth);
    updated.setMonth(currentMonth.getMonth() + offset);
    onMonthChange(updated);
  };

  const handleMonthInput = (value) => {
    if (!value) return;
    const [year, month] = value.split('-');
    const updated = new Date(Number(year), Number(month) - 1, 1);
    onMonthChange(updated);
  };

  return (
    <div className="month-navigator">
      <button type="button" onClick={() => goToOffset(-1)} aria-label="Previous month">
        ◀
      </button>
      <div className="month-picker">
        <h2>{monthName}</h2>
        <input
          type="month"
          aria-label="Jump to month"
          value={pickerValue}
          onChange={(e) => handleMonthInput(e.target.value)}
        />
      </div>
      <button type="button" onClick={() => goToOffset(1)} aria-label="Next month">
        ▶
      </button>
    </div>
  );
}

function EventForm({ onAddEvent, selectedDate }) {
  const today = formatDateValue(new Date());
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !date) return;

    onAddEvent({
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      startTime: allDay ? '' : startTime,
      endTime: allDay ? '' : endTime,
      allDay,
      details: details.trim(),
    });

    setTitle('');
    setDate(today);
    setStartTime('09:00');
    setEndTime('10:00');
    setAllDay(false);
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
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={allDay}
          />
        </label>
        <label>
          End
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={allDay}
          />
        </label>
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        All day event
      </label>
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

function DayCell({ date, events, selectedDate, onSelectDate }) {
  if (!date) {
    return <div className="day-cell empty" />;
  }

  const dateLabel = date.getDate();
  const dateKey = formatDateValue(date);
  const dayEvents = events.filter((event) => event.date === dateKey);
  const holidayEvents = regionalHolidays[dateKey] ?? [];
  const combinedEvents = [
    ...holidayEvents.map((holiday) => ({ id: holiday.name, title: holiday.name, allDay: true })),
    ...dayEvents,
  ];
  const hasEvents = combinedEvents.length > 0;
  const isSelected = selectedDate === dateKey;

  return (
    <button
      type="button"
      className={`day-cell ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelectDate(dateKey)}
      aria-label={`Select ${dateKey}`}
    >
      <div className="day-header">
        <span className="day-number">{dateLabel}</span>
        <span className="day-weekday">{dayLabels[date.getDay()]}</span>
        {hasEvents && <span className="note-icon" aria-hidden="true">🗒️</span>}
      </div>
      <ul className="event-list">
        {combinedEvents.map((event) => (
          <li key={event.id} className="event-chip">
            <div className="event-title">{event.title}</div>
            <div className="event-time">
              {event.allDay || (!event.startTime && !event.endTime) ? 'All day' : event.startTime}
              {event.endTime ? ` – ${event.endTime}` : ''}
            </div>
            {event.details && <p className="event-notes">{event.details}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalendarGrid({ currentMonth, events, selectedDate, onSelectDate }) {
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  return (
    <div className="calendar-grid">
      {dayLabels.map((label) => (
        <div key={label} className="day-label">
          {label}
        </div>
      ))}
      {calendarDays.map((date, index) => (
        <DayCell
          key={date?.toISOString() ?? `empty-${index}`}
          date={date}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />
      ))}
    </div>
  );
}

function SelectedDayDetails({ date, events }) {
  if (!date) {
    return (
      <div className="selected-day-panel">
        <p className="muted">Select a day to view details.</p>
      </div>
    );
  }

  const friendlyDate = new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const holidayEvents = regionalHolidays[date] ?? [];
  const dayEvents = events.filter((event) => event.date === date);
  const combinedEvents = [
    ...holidayEvents.map((holiday) => ({ id: holiday.name, title: holiday.name, allDay: true, tag: holiday.region })),
    ...dayEvents,
  ];

  return (
    <div className="selected-day-panel">
      <div className="selected-day-header">
        <h3>{friendlyDate}</h3>
        <p className="muted">Full agenda for this day</p>
      </div>
      <div className="selected-day-list">
        {combinedEvents.length === 0 && <p className="muted">No events or holidays yet.</p>}
        {combinedEvents.map((event) => (
          <div key={event.id} className="selected-event">
            <div className="selected-event-top">
              <span className="selected-event-title">{event.title}</span>
              {event.tag && <span className="badge">{event.tag}</span>}
            </div>
            <div className="selected-event-time">
              {event.allDay || (!event.startTime && !event.endTime) ? 'All day' : event.startTime}
              {event.endTime ? ` – ${event.endTime}` : ''}
            </div>
            {event.details && <p className="event-notes">{event.details}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDateValue(new Date()));

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
          <EventForm onAddEvent={handleAddEvent} selectedDate={selectedDate} />
          <SelectedDayDetails date={selectedDate} events={events} />
        </section>

        <section className="panel calendar-panel">
          <CalendarGrid
            currentMonth={currentMonth}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </section>
      </main>
    </div>
  );
}
