import { useMemo, useState } from 'react';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// function toISO(d) {
//   return d.toISOString().slice(0, 10);
// }
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isBooked(dateStr, bookedRanges) {
  return bookedRanges.some((r) => dateStr >= r.start_date.slice(0, 10) && dateStr <= r.end_date.slice(0, 10));
}

export default function AvailabilityCalendar({ bookedRanges = [], value, onChange }) {
  const [viewDate, setViewDate] = useState(new Date());

  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);

  const monthGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewDate]);

  const handleClick = (date) => {
    const iso = toISO(date);
    if (date < today || isBooked(iso, bookedRanges)) return;

    // if (!value.start || (value.start && value.end)) {
    if (!value.start || (value.end && value.start !== value.end)) {
      onChange({ start: iso, end: iso });
    } else if (iso < value.start) {
      onChange({ start: iso, end: value.start });
    } else {
      onChange({ start: value.start, end: iso });
    }
  };

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex-between">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>‹</button>
        <strong>{monthLabel}</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="calendar">
        {DAY_LABELS.map((d) => <div key={d} className="day-label">{d}</div>)}
        {monthGrid.map((date, i) => {
          if (!date) return <div key={i} className="day blank" />;
          const iso = toISO(date);
          const past = date < today;
          const booked = isBooked(iso, bookedRanges);
          const selected = iso === value.start || iso === value.end;
          const inRange = value.start && value.end && iso > value.start && iso < value.end;
          const cls = ['day'];
          if (past) cls.push('past');
          if (booked) cls.push('booked');
          if (selected) cls.push('selected');
          if (inRange) cls.push('in-range');
          return (
            <div key={i} className={cls.join(' ')} onClick={() => handleClick(date)} title={booked ? 'Already booked' : ''}>
              {date.getDate()}
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--color-danger-bg)' }} /> Booked</span>
        <span><i style={{ background: 'var(--color-primary)' }} /> Your dates</span>
        <span><i style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} /> Free</span>
      </div>
    </div>
  );
}
