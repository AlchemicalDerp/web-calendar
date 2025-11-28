import { useEffect, useMemo, useState } from 'react';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateValue(date) {
  return date.toISOString().split('T')[0];
}

function addToDate(baseDate, amount, unit) {
  const updated = new Date(baseDate);
  if (unit === 'days') updated.setDate(updated.getDate() + amount);
  if (unit === 'weeks') updated.setDate(updated.getDate() + amount * 7);
  if (unit === 'months') updated.setMonth(updated.getMonth() + amount);
  if (unit === 'years') updated.setFullYear(updated.getFullYear() + amount);
  return updated;
}

function getTextColorForBackground(hex) {
  const value = hex.replace('#', '');
  if (value.length !== 6) return '#0f172a';
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.55 ? '#0f172a' : '#ffffff';
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

  const handleWheel = (event) => {
    event.preventDefault();
    const offset = event.deltaY > 0 ? 1 : -1;
    goToOffset(offset);
  };

  return (
    <div className="month-navigator">
      <button type="button" onClick={() => goToOffset(-1)} aria-label="Previous month">
        ◀
      </button>
      <div className="month-picker">
        <h2>{monthName}</h2>
        <div className="month-picker-input" onWheel={handleWheel}>
          <input
            type="month"
            aria-label="Jump to month"
            value={pickerValue}
            onChange={(e) => handleMonthInput(e.target.value)}
          />
          <button type="button" className="jump-button" onClick={() => handleMonthInput(pickerValue)}>
            Jump
          </button>
        </div>
      </div>
      <button type="button" onClick={() => goToOffset(1)} aria-label="Next month">
        ▶
      </button>
    </div>
  );
}

function EventForm({ onAddEvent, selectedRange, editingEvent, onResetEditing }) {
  const today = formatDateValue(new Date());
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [details, setDetails] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [repeatUnit, setRepeatUnit] = useState('none');
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatCount, setRepeatCount] = useState(1);

  useEffect(() => {
    if (selectedRange?.start) {
      setStartDate(selectedRange.start);
      setEndDate(selectedRange.end ?? selectedRange.start);
    }
  }, [selectedRange]);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setStartDate(editingEvent.startDate);
      setEndDate(editingEvent.endDate ?? editingEvent.startDate);
      setStartTime(editingEvent.startTime || '09:00');
      setEndTime(editingEvent.endTime || '10:00');
      setAllDay(Boolean(editingEvent.allDay));
      setDetails(editingEvent.details || '');
      setColor(editingEvent.color || '#3b82f6');
      setRepeatUnit(editingEvent.repeatUnit || 'none');
      setRepeatEvery(editingEvent.repeatEvery || 1);
      setRepeatCount(editingEvent.repeatCount || 1);
    }
  }, [editingEvent]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !startDate) return;
    const sanitizedRepeatUnit = repeatUnit === 'none' ? null : repeatUnit;
    const count = sanitizedRepeatUnit ? Math.max(1, Number(repeatCount)) : 1;
    const every = sanitizedRepeatUnit ? Math.max(1, Number(repeatEvery)) : 1;

    onAddEvent({
      baseEvent: {
        id: editingEvent?.id ?? crypto.randomUUID(),
        title: title.trim(),
        startDate,
        endDate: endDate || startDate,
        startTime: allDay ? '' : startTime,
        endTime: allDay ? '' : endTime,
        allDay,
        details: details.trim(),
        color,
        repeatUnit: sanitizedRepeatUnit,
        repeatEvery: every,
        repeatCount: count,
        order: editingEvent?.order,
      },
      editing: Boolean(editingEvent),
    });

    setTitle('');
    setStartDate(today);
    setEndDate(today);
    setStartTime('09:00');
    setEndTime('10:00');
    setAllDay(false);
    setDetails('');
    setColor('#3b82f6');
    setRepeatUnit('none');
    setRepeatEvery(1);
    setRepeatCount(1);
    onResetEditing();
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-header-row">
        <h3>{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
        {editingEvent && (
          <button type="button" className="ghost" onClick={onResetEditing}>
            Cancel edit
          </button>
        )}
      </div>
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
          Start date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label>
          End date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
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
      <div className="form-row">
        <label>
          Color code
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label>
          Repeat every
          <div className="repeat-row">
            <input
              type="number"
              min="1"
              value={repeatEvery}
              onChange={(e) => setRepeatEvery(e.target.value)}
              disabled={repeatUnit === 'none'}
            />
            <select value={repeatUnit} onChange={(e) => setRepeatUnit(e.target.value)}>
              <option value="none">Does not repeat</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </label>
        <label>
          Repeat count
          <input
            type="number"
            min="1"
            value={repeatCount}
            onChange={(e) => setRepeatCount(e.target.value)}
            disabled={repeatUnit === 'none'}
          />
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
      <button type="submit">{editingEvent ? 'Save changes' : 'Add to calendar'}</button>
    </form>
  );
}

function DayCell({ date, events, selectedRange, onSelectDate, onRangeExtend }) {
  if (!date) {
    return <div className="day-cell empty" />;
  }

  const dateLabel = date.getDate();
  const dateKey = formatDateValue(date);
  const dayEvents = events.filter((event) => dateKey >= event.startDate && dateKey <= event.endDate);
  const holidayEvents = regionalHolidays[dateKey] ?? [];
  const combinedEvents = [
    ...holidayEvents.map((holiday) => ({ id: holiday.name, title: holiday.name, allDay: true })),
    ...dayEvents.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  ];
  const hasEvents = combinedEvents.length > 0;
  const isSelected =
    dateKey >= (selectedRange?.start || '') && dateKey <= (selectedRange?.end || selectedRange?.start || '');
  const hasMultipleUserEvents = dayEvents.length > 1;
  const topColorEvent = dayEvents.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];

  const handleClick = (e) => {
    if ((e.ctrlKey || e.shiftKey) && selectedRange?.start && dateKey > selectedRange.start) {
      onRangeExtend(dateKey);
    } else {
      onSelectDate(dateKey);
    }
  };

  return (
    <button
      type="button"
      className={`day-cell ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      aria-label={`Select ${dateKey}`}
      style={topColorEvent ? { borderColor: topColorEvent.color } : undefined}
    >
      <div className="day-header">
        <span className="day-number">{dateLabel}</span>
        <span className="day-weekday">{dayLabels[date.getDay()]}</span>
        {hasEvents && <span className="note-icon" aria-hidden="true">🗒️</span>}
        {hasMultipleUserEvents && <span className="multiple-icon" aria-hidden="true">⭐</span>}
      </div>
      <ul className="event-list">
        {combinedEvents.map((event) => (
          <li
            key={event.id}
            className="event-chip"
            style={
              event.color
                ? { background: event.color, color: getTextColorForBackground(event.color) }
                : undefined
            }
          >
            <div className="event-title">{event.title}</div>
            <div className="event-time">
              {event.allDay || (!event.startTime && !event.endTime) ? 'All day' : event.startTime}
              {event.endTime ? ` – ${event.endTime}` : ''}
            </div>
            {event.details && <p className="event-notes">{event.details}</p>}
          </li>
        ))}
      </ul>
    </button>
  );
}

function CalendarGrid({ currentMonth, events, selectedRange, onSelectDate, onRangeExtend }) {
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
          selectedRange={selectedRange}
          onSelectDate={onSelectDate}
          onRangeExtend={onRangeExtend}
        />
      ))}
    </div>
  );
}

function SelectedDayDetails({ date, events, onEditEvent, onMoveEvent }) {
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
  const dayEvents = events
    .filter((event) => date >= event.startDate && date <= event.endDate)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
        {combinedEvents.map((event, idx) => {
          const dayIndex = dayEvents.findIndex((dayEvent) => dayEvent.id === event.id);
          return (
          <div key={event.id} className="selected-event">
            <div className="selected-event-top">
              <span className="selected-event-title">{event.title}</span>
              {event.tag && <span className="badge">{event.tag}</span>}
              {event.color && (
                <span
                  className="color-dot"
                  style={{ background: event.color, borderColor: getTextColorForBackground(event.color) }}
                  aria-label="Event color"
                />
              )}
            </div>
            <div className="selected-event-time">
              {event.allDay || (!event.startTime && !event.endTime) ? 'All day' : event.startTime}
              {event.endTime ? ` – ${event.endTime}` : ''}
              {event.startDate && event.endDate && event.startDate !== event.endDate && (
                <span className="date-range">({event.startDate} → {event.endDate})</span>
              )}
            </div>
            {event.details && <p className="event-notes">{event.details}</p>}
            {!event.tag && (
              <div className="selected-event-actions">
                <button type="button" onClick={() => onEditEvent(event)}>Edit</button>
                <div className="reorder-buttons">
                  <button type="button" aria-label="Move earlier" onClick={() => onMoveEvent(dayIndex, 'up')}>
                    ↑
                  </button>
                  <button type="button" aria-label="Move later" onClick={() => onMoveEvent(dayIndex, 'down')}>
                    ↓
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [selectedRange, setSelectedRange] = useState({
    start: formatDateValue(new Date()),
    end: formatDateValue(new Date()),
  });
  const [editingEvent, setEditingEvent] = useState(null);

  const nextOrderForDate = (date) => {
    const filtered = events.filter((event) => date >= event.startDate && date <= event.endDate);
    if (filtered.length === 0) return 0;
    return Math.max(...filtered.map((e) => e.order ?? 0)) + 1;
  };

  const handleAddEvent = ({ baseEvent, editing }) => {
    setEvents((existing) => {
      const cleanedExisting = editing ? existing.filter((event) => event.id !== baseEvent.id) : existing;

      const occurrences = [];
      const count = baseEvent.repeatUnit ? baseEvent.repeatCount : 1;
      for (let i = 0; i < count; i += 1) {
        const start = baseEvent.repeatUnit
          ? addToDate(new Date(baseEvent.startDate), i * baseEvent.repeatEvery, baseEvent.repeatUnit)
          : new Date(baseEvent.startDate);
        const end = baseEvent.repeatUnit
          ? addToDate(new Date(baseEvent.endDate), i * baseEvent.repeatEvery, baseEvent.repeatUnit)
          : new Date(baseEvent.endDate);

        occurrences.push({
          ...baseEvent,
          id: i === 0 ? baseEvent.id : `${baseEvent.id}-${i}`,
          startDate: formatDateValue(start),
          endDate: formatDateValue(end),
          repeatIndex: i,
          order: editing ? baseEvent.order ?? 0 : nextOrderForDate(formatDateValue(start)),
        });
      }

      return [...cleanedExisting, ...occurrences];
    });
  };

  const handleSelectDate = (date) => {
    setSelectedRange({ start: date, end: date });
  };

  const handleExtendRange = (endDate) => {
    setSelectedRange((prev) => ({ start: prev.start, end: endDate }));
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setSelectedRange({ start: event.startDate, end: event.endDate });
  };

  const handleResetEditing = () => {
    setEditingEvent(null);
  };

  const handleMoveEvent = (index, direction) => {
    if (index < 0) return;
    const date = selectedRange.start;
    setEvents((existing) => {
      const dayEvents = existing
        .filter((event) => date >= event.startDate && date <= event.endDate)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= dayEvents.length) return existing;
      const temp = dayEvents[index].order;
      dayEvents[index].order = dayEvents[targetIndex].order;
      dayEvents[targetIndex].order = temp;

      return existing.map((event) => {
        const match = dayEvents.find((d) => d.id === event.id);
        return match ? { ...event, order: match.order } : event;
      });
    });
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
          <EventForm
            onAddEvent={handleAddEvent}
            selectedRange={selectedRange}
            editingEvent={editingEvent}
            onResetEditing={handleResetEditing}
          />
          <SelectedDayDetails
            date={selectedRange.start}
            events={events}
            onEditEvent={handleEditEvent}
            onMoveEvent={handleMoveEvent}
          />
        </section>

        <section className="panel calendar-panel">
          <CalendarGrid
            currentMonth={currentMonth}
            events={events}
            selectedRange={selectedRange}
            onSelectDate={handleSelectDate}
            onRangeExtend={handleExtendRange}
          />
        </section>
      </main>
    </div>
  );
}
