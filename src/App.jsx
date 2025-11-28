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

const horoscopeBySign = {
  Aries: 'Channel your drive into something tangible today—momentum is on your side.',
  Taurus: 'Ground yourself with small routines; comfort will fuel your creativity.',
  Gemini: 'Stay curious and ask more questions—conversations spark fresh ideas.',
  Cancer: 'Protect your energy and lean on your circle; support is closer than you think.',
  Leo: 'Lead with warmth. Your confidence can brighten someone else’s day.',
  Virgo: 'Organize the details, but remember to pause—clarity comes with rest.',
  Libra: 'Seek balance between commitments. A tiny adjustment restores harmony.',
  Scorpio: 'Trust your instincts; the subtle clues you notice are meaningful.',
  Sagittarius: 'Say yes to a new experience. Adventure unlocks the path ahead.',
  Capricorn: 'Steady progress wins. Celebrate small wins to keep momentum.',
  Aquarius: 'Share your ideas. Collaboration brings your vision into focus.',
  Pisces: 'Give your imagination space to wander—answers surface when you flow.',
};

const initialUserSettings = {
  displayName: '',
  profileImage: '',
  theme: 'light',
  accentColor: '#6366f1',
  region: 'US',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  birthday: '',
  zodiacEnabled: false,
  clockFormat: '12',
};

function loadUsers() {
  const stored = localStorage.getItem('planner_users');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse users', error);
    return [];
  }
}

function getZodiacSign(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return null;
  const monthDay = (month - 1) * 31 + day; // coarse ordering for range checks

  const ranges = [
    { sign: 'Capricorn', start: 12 * 31 + 22, end: 1 * 31 + 19 },
    { sign: 'Aquarius', start: 1 * 31 + 20, end: 2 * 31 + 18 },
    { sign: 'Pisces', start: 2 * 31 + 19, end: 3 * 31 + 20 },
    { sign: 'Aries', start: 3 * 31 + 21, end: 4 * 31 + 19 },
    { sign: 'Taurus', start: 4 * 31 + 20, end: 5 * 31 + 20 },
    { sign: 'Gemini', start: 5 * 31 + 21, end: 6 * 31 + 20 },
    { sign: 'Cancer', start: 6 * 31 + 21, end: 7 * 31 + 22 },
    { sign: 'Leo', start: 7 * 31 + 23, end: 8 * 31 + 22 },
    { sign: 'Virgo', start: 8 * 31 + 23, end: 9 * 31 + 22 },
    { sign: 'Libra', start: 9 * 31 + 23, end: 10 * 31 + 22 },
    { sign: 'Scorpio', start: 10 * 31 + 23, end: 11 * 31 + 21 },
    { sign: 'Sagittarius', start: 11 * 31 + 22, end: 12 * 31 + 21 },
  ];

  for (const range of ranges) {
    if (range.start > range.end) {
      if (monthDay >= range.start || monthDay <= range.end) return range.sign;
    } else if (monthDay >= range.start && monthDay <= range.end) {
      return range.sign;
    }
  }

  return null;
}

function getStoredSessionId() {
  const fromStorage = localStorage.getItem('planner_session');
  if (fromStorage) return fromStorage;
  const cookieMatch = document.cookie.match(/(?:^|; )planner_session=([^;]+)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  if (value.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  const [monthInput, setMonthInput] = useState(currentMonth.getMonth());
  const [yearInput, setYearInput] = useState(currentMonth.getFullYear().toString());

  useEffect(() => {
    setMonthInput(currentMonth.getMonth());
    setYearInput(currentMonth.getFullYear().toString());
  }, [currentMonth]);

  const goToOffset = (offset) => {
    const updated = new Date(currentMonth);
    updated.setMonth(currentMonth.getMonth() + offset);
    onMonthChange(updated);
  };

  const handleJump = () => {
    if (!yearInput) return;
    const safeYear = Math.max(1, Number.parseInt(yearInput, 10));
    const safeMonth = Number(monthInput);
    if (Number.isNaN(safeYear) || Number.isNaN(safeMonth)) return;
    const updated = new Date(safeYear, safeMonth, 1);
    onMonthChange(updated);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const offset = event.deltaY > 0 ? 1 : -1;
    goToOffset(offset);
  };

  return (
    <div className="month-navigator">
      <button type="button" className="nav-btn prev" onClick={() => goToOffset(-1)} aria-label="Previous month">
        ◀
      </button>
      <div className="month-picker" onWheel={handleWheel}>
        <h2>{monthName}</h2>
        <div className="month-picker-input">
          <label className="visually-hidden" htmlFor="month-select">
            Select month
          </label>
          <select
            id="month-select"
            value={monthInput}
            onChange={(e) => setMonthInput(Number(e.target.value))}
            aria-label="Select month"
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx} value={idx}>
                {new Date(0, idx).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <label className="visually-hidden" htmlFor="year-input">
            Enter year
          </label>
          <input
            id="year-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Enter year"
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="2025"
          />
          <button type="button" className="jump-button" onClick={handleJump}>
            Jump
          </button>
        </div>
      </div>
      <button type="button" className="nav-btn next" onClick={() => goToOffset(1)} aria-label="Next month">
        ▶
      </button>
    </div>
  );
}

function AuthModal({ mode, onSwitchMode, onLogin, onSignup, error }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === 'login') {
      onLogin({ identifier: username || email, password });
    } else {
      onSignup({ username, email, password, confirmPassword });
    }
  };

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">Sign in to sync your calendar and settings.</p>
        {error && <p className="error-text">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourhandle"
              required={mode === 'signup'}
            />
          </label>
          {mode === 'signup' && (
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
          )}
          {mode === 'login' && (
            <label>
              Email (optional)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          )}
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {mode === 'signup' && (
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
          )}
          <button type="submit">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
        </form>
        <div className="auth-footer">
          {mode === 'login' ? (
            <p>
              New here?{' '}
              <button type="button" className="link" onClick={() => onSwitchMode('signup')}>
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button type="button" className="link" onClick={() => onSwitchMode('login')}>
                Log in instead
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EventForm({ onAddEvent, selectedRange, editingEvent, onResetEditing, disabled }) {
  const today = formatDateValue(new Date());
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [details, setDetails] = useState('');
  const [color, setColor] = useState(initialUserSettings.accentColor);
  const [repeatUnit, setRepeatUnit] = useState('none');
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUntil, setRepeatUntil] = useState('');

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
      setColor(editingEvent.color || initialUserSettings.accentColor);
      setRepeatUnit(editingEvent.repeatUnit || 'none');
      setRepeatEvery(editingEvent.repeatEvery || 1);
      setRepeatUntil(editingEvent.repeatUntil || '');
    }
  }, [editingEvent]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !startDate || disabled) return;
    const sanitizedRepeatUnit = repeatUnit === 'none' ? null : repeatUnit;
    const every = sanitizedRepeatUnit ? Math.max(1, Number(repeatEvery)) : 1;
    const sanitizedRepeatUntil = sanitizedRepeatUnit ? repeatUntil || null : null;

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
        repeatUntil: sanitizedRepeatUntil,
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
    setColor(initialUserSettings.accentColor);
    setRepeatUnit('none');
    setRepeatEvery(1);
    setRepeatUntil('');
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
          disabled={disabled}
        />
      </label>
      <div className="form-row">
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            disabled={disabled}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            disabled={disabled}
          />
        </label>
        <label>
          Start
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={allDay || disabled}
          />
        </label>
        <label>
          End
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={allDay || disabled}
          />
        </label>
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          disabled={disabled}
        />
        All day event
      </label>
      <div className="form-row">
        <label>
          Color code
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={disabled} />
        </label>
        <label>
          Repeat every
          <div className="repeat-row">
            <input
              type="number"
              min="1"
              value={repeatEvery}
              onChange={(e) => setRepeatEvery(e.target.value)}
              disabled={repeatUnit === 'none' || disabled}
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
          Expires when
          <input
            type="date"
            value={repeatUntil}
            onChange={(e) => setRepeatUntil(e.target.value)}
            disabled={repeatUnit === 'none' || disabled}
          />
          <p className="muted micro-copy">Leave empty to repeat indefinitely.</p>
        </label>
      </div>
      <label>
        Notes
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Agenda, location, links"
          rows="2"
          disabled={disabled}
        />
      </label>
      <button type="submit" disabled={disabled}>
        {editingEvent ? 'Save changes' : 'Add to calendar'}
      </button>
      {disabled && <p className="muted">Sign in to add or edit events.</p>}
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
  const sortedDayEvents = [...dayEvents].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.startTime || '').localeCompare(b.startTime || '') || a.title.localeCompare(b.title),
  );
  const combinedEvents = [
    ...holidayEvents.map((holiday) => ({ id: holiday.name, title: holiday.name, allDay: true })),
    ...sortedDayEvents,
  ];
  const topEvent = combinedEvents[0];
  const hasEvents = combinedEvents.length > 0;
  const isSelected =
    dateKey >= (selectedRange?.start || '') && dateKey <= (selectedRange?.end || selectedRange?.start || '');
  const hasMultipleEvents = combinedEvents.length > 1;
  const topColorEvent = sortedDayEvents[0];

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
        {hasMultipleEvents && <span className="multiple-icon" aria-hidden="true">⭐</span>}
      </div>
      <ul className="event-list">
        {topEvent && (
          <li
            key={topEvent.id}
            className="event-chip"
            style={
              topEvent.color
                ? { background: topEvent.color, color: getTextColorForBackground(topEvent.color) }
                : undefined
            }
          >
            <div className="event-title">{topEvent.title}</div>
            <div className="event-time">
              {topEvent.allDay || (!topEvent.startTime && !topEvent.endTime) ? 'All day' : topEvent.startTime}
              {topEvent.endTime ? ` – ${topEvent.endTime}` : ''}
            </div>
            {topEvent.details && <p className="event-notes">{topEvent.details}</p>}
          </li>
        )}
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

function SelectedDayDetails({ date, events, onEditEvent, onReorderEvent }) {
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
    .sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.startTime || '').localeCompare(b.startTime || '') || a.title.localeCompare(b.title),
    );
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
        {combinedEvents.map((event) => {
          const dayIndex = dayEvents.findIndex((dayEvent) => dayEvent.id === event.id);
          const isDraggable = dayIndex !== -1 && !event.tag;
          return (
            <div
              key={event.id}
              className="selected-event"
              draggable={isDraggable}
              onDragStart={(e) => {
                if (!isDraggable) return;
                e.dataTransfer.setData('text/plain', String(dayIndex));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                if (!isDraggable) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!isDraggable) return;
                e.preventDefault();
                const fromIndex = Number(e.dataTransfer.getData('text/plain'));
                const toIndex = dayIndex;
                if (Number.isNaN(fromIndex)) return;
                onReorderEvent(fromIndex, toIndex);
              }}
            >
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
                  <span className="drag-hint" aria-hidden="true">
                    Drag to reorder
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopBar({ user, timeString, onToggleSettings }) {
  return (
    <div className="top-bar">
      <div className="top-clock">
        <span className="clock-label">Current time</span>
        <span className="clock-value">{timeString || '--:--:--'}</span>
      </div>
      <div className="user-actions">
        {user && <span className="user-name">{user.displayName || user.username}</span>}
        <button type="button" className="avatar-button" onClick={onToggleSettings} aria-label="User settings">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.displayName || user.username} />
          ) : (
            <span className="avatar-fallback">{(user?.displayName || user?.username || 'U')[0]}</span>
          )}
        </button>
      </div>
    </div>
  );
}

function SettingsPanel({ user, onSave, onClose, onLogout }) {
  const [settings, setSettings] = useState({ ...initialUserSettings, ...(user ?? {}) });

  useEffect(() => {
    setSettings({ ...initialUserSettings, ...(user ?? {}) });
  }, [user]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(settings);
  };

  return (
    <div className="settings-drawer" role="dialog" aria-modal="true">
      <div className="settings-content">
        <div className="settings-header">
          <h3>Profile & Preferences</h3>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            Username (for login)
            <input type="text" value={settings.username || ''} readOnly />
          </label>
          <label>
            Name
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="Your name"
            />
          </label>
          <label>
            Profile image URL
            <input
              type="url"
              value={settings.profileImage}
              onChange={(e) => handleChange('profileImage', e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            Theme
            <select value={settings.theme} onChange={(e) => handleChange('theme', e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Accent color
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => handleChange('accentColor', e.target.value)}
            />
          </label>
          <label>
            Region
            <input
              type="text"
              value={settings.region}
              onChange={(e) => handleChange('region', e.target.value)}
              placeholder="US"
            />
          </label>
          <label>
            Time zone
            <input
              type="text"
              value={settings.timeZone}
              onChange={(e) => handleChange('timeZone', e.target.value)}
              placeholder="America/New_York"
            />
          </label>
          <label>
            Birthday
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}-\d{2}-\d{2}"
              value={settings.birthday}
              onChange={(e) => handleChange('birthday', e.target.value)}
            />
            <p className="micro-copy">We’ll add a yearly birthday reminder.</p>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.zodiacEnabled}
              onChange={(e) => handleChange('zodiacEnabled', e.target.checked)}
            />
            Show horoscope card
          </label>
          <label>
            Clock format
            <select value={settings.clockFormat} onChange={(e) => handleChange('clockFormat', e.target.value)}>
              <option value="12">12-hour</option>
              <option value="24">24-hour</option>
            </select>
          </label>
          <div className="settings-actions">
            <button type="submit">Save settings</button>
            <button type="button" className="ghost" onClick={onLogout}>
              Log out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HoroscopeCard({ zodiacSign }) {
  if (!zodiacSign) return null;
  return (
    <div className="horoscope-card">
      <div className="horoscope-icon" aria-hidden="true">
        ✨
      </div>
      <div>
        <p className="eyebrow">Horoscope</p>
        <h4>{zodiacSign}</h4>
        <p className="muted">{horoscopeBySign[zodiacSign]}</p>
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
  const [users, setUsers] = useState(loadUsers);
  const [currentUserId, setCurrentUserId] = useState(() => getStoredSessionId());
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [clockString, setClockString] = useState('');

  const currentUser = users.find((user) => user.id === currentUserId) || null;

  useEffect(() => {
    localStorage.setItem('planner_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const sessionId = getStoredSessionId();
    if (!currentUserId && sessionId) {
      setCurrentUserId(sessionId);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setEvents(currentUser.events || []);
      document.cookie = `planner_session=${currentUser.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
      localStorage.setItem('planner_session', currentUser.id);
    } else {
      setEvents([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUserId) return;
    const exists = users.some((user) => user.id === currentUserId);
    if (!exists) {
      setCurrentUserId(null);
      localStorage.removeItem('planner_session');
      document.cookie = 'planner_session=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
    }
  }, [currentUserId, users]);

  useEffect(() => {
    if (!currentUser) return;
    setEvents((prev) => ensureBirthdayEvent(prev, currentUser));
  }, [currentUser?.birthday]);

  useEffect(() => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              events,
            }
          : user,
      ),
    );
  }, [events, currentUser]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = currentUser?.theme || 'light';
    root.setAttribute('data-theme', theme);
    const accent = currentUser?.accentColor || initialUserSettings.accentColor;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', hexToRgba(accent, 0.16));
    root.style.setProperty('--accent-strong', hexToRgba(accent, 0.28));
    root.style.setProperty('--accent-contrast', getTextColorForBackground(accent));
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentUser) {
        setClockString('');
        return;
      }
      const formatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: currentUser.clockFormat !== '24',
        timeZone: currentUser.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setClockString(formatter.format(new Date()));
    }, 1000);
    if (currentUser) {
      const formatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: currentUser.clockFormat !== '24',
        timeZone: currentUser.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setClockString(formatter.format(new Date()));
    } else {
      setClockString('--:--:--');
    }
    return () => clearInterval(interval);
  }, [currentUser]);

  const ensureBirthdayEvent = (baseEvents, user) => {
    const withoutBirthday = baseEvents.filter((event) => event.id !== `birthday-${user.id}`);
    if (!user.birthday) return withoutBirthday;
    const startDate = user.birthday;
    const birthdayEvent = {
      id: `birthday-${user.id}`,
      title: `${user.displayName || user.username}'s Birthday`,
      startDate,
      endDate: startDate,
      allDay: true,
      details: '',
      color: '#f59e0b',
      repeatUnit: 'years',
      repeatEvery: 1,
      repeatUntil: null,
      order: 0,
    };
    return [birthdayEvent, ...withoutBirthday];
  };

  const nextOrderForDate = (date) => {
    const filtered = events.filter((event) => date >= event.startDate && date <= event.endDate);
    if (filtered.length === 0) return 0;
    return Math.max(...filtered.map((e) => e.order ?? 0)) + 1;
  };

  const handleSignup = ({ username, email, password, confirmPassword }) => {
    if (!username || !email || !password || !confirmPassword) {
      setAuthError('Please fill all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    const exists = users.some((user) => user.username === username || user.email === email);
    if (exists) {
      setAuthError('A user with that username or email already exists.');
      return;
    }
    const newUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      events: [],
      ...initialUserSettings,
      displayName: username,
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setAuthError('');
  };

  const handleLogin = ({ identifier, password }) => {
    const match = users.find(
      (user) => (user.username === identifier || user.email === identifier) && user.password === password,
    );
    if (!match) {
      setAuthError('Invalid credentials.');
      return;
    }
    setCurrentUserId(match.id);
    setAuthError('');
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setEditingEvent(null);
    setShowSettings(false);
    localStorage.removeItem('planner_session');
    document.cookie = 'planner_session=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
  };

  const handleSaveSettings = (updated) => {
    if (!currentUser) return;
    setUsers((prev) => prev.map((user) => (user.id === currentUser.id ? { ...user, ...updated } : user)));
    setEvents((prev) => ensureBirthdayEvent(prev, { ...currentUser, ...updated }));
    setShowSettings(false);
  };

  const handleAddEvent = ({ baseEvent, editing }) => {
    if (!currentUser) return;
    setEvents((existing) => {
      const cleanedExisting = editing
        ? existing.filter((event) => event.id !== baseEvent.id && !event.id.startsWith(`${baseEvent.id}-`))
        : existing;

      const occurrences = [];
      const repeatUntilDate = baseEvent.repeatUntil ? new Date(baseEvent.repeatUntil) : null;
      const hasRepeat = Boolean(baseEvent.repeatUnit);
      const maxOccurrences = hasRepeat ? 200 : 1;

      let currentStart = new Date(baseEvent.startDate);
      let currentEnd = new Date(baseEvent.endDate);
      let index = 0;

      while (index < maxOccurrences) {
        occurrences.push({
          ...baseEvent,
          id: index === 0 ? baseEvent.id : `${baseEvent.id}-${index}`,
          startDate: formatDateValue(currentStart),
          endDate: formatDateValue(currentEnd),
          repeatIndex: index,
          order: editing ? baseEvent.order ?? 0 : nextOrderForDate(formatDateValue(currentStart)),
        });

        if (!hasRepeat) break;
        const nextStart = addToDate(currentStart, baseEvent.repeatEvery, baseEvent.repeatUnit);
        const nextEnd = addToDate(currentEnd, baseEvent.repeatEvery, baseEvent.repeatUnit);

        if (repeatUntilDate && nextStart > repeatUntilDate) break;

        currentStart = nextStart;
        currentEnd = nextEnd;
        index += 1;
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

  const handleReorderEvent = (fromIndex, toIndex) => {
    if (!currentUser) return;
    const date = selectedRange.start;
    setEvents((existing) => {
      const dayEvents = existing
        .filter((event) => date >= event.startDate && date <= event.endDate)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (fromIndex < 0 || toIndex < 0 || fromIndex >= dayEvents.length || toIndex >= dayEvents.length) {
        return existing;
      }

      const updatedOrder = [...dayEvents];
      const [moved] = updatedOrder.splice(fromIndex, 1);
      updatedOrder.splice(toIndex, 0, moved);

      return existing.map((event) => {
        const orderIndex = updatedOrder.findIndex((item) => item.id === event.id);
        return orderIndex >= 0 ? { ...event, order: orderIndex } : event;
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
      <TopBar user={currentUser} timeString={clockString} onToggleSettings={() => setShowSettings(true)} />
      {currentUser?.zodiacEnabled && <HoroscopeCard zodiacSign={getZodiacSign(currentUser.birthday)} />}

      <main className="layout">
        <section className="panel">
          <EventForm
            onAddEvent={handleAddEvent}
            selectedRange={selectedRange}
            editingEvent={editingEvent}
            onResetEditing={handleResetEditing}
            disabled={!currentUser}
          />
          <SelectedDayDetails
            date={selectedRange.start}
            events={events}
            onEditEvent={handleEditEvent}
            onReorderEvent={handleReorderEvent}
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

      {!currentUser && (
        <AuthModal
          mode={authMode}
          onSwitchMode={setAuthMode}
          onLogin={handleLogin}
          onSignup={handleSignup}
          error={authError}
        />
      )}

      {showSettings && currentUser && (
        <SettingsPanel
          user={currentUser}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
