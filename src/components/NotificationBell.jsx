import React, { useState, useEffect, useRef } from 'react';
import { MdNotifications, MdCheckCircle, MdClose } from 'react-icons/md';

/* ─── helpers ─────────────────────────────────────────────── */
const getToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const daysDiff = (dateStr) => {
  if (!dateStr) return null;
  const t = new Date(dateStr);
  const target = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((target - getToday()) / 86400000);
};

const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtAmt = (a) => '₹' + Number(a).toLocaleString('en-IN');

/* ─── build notifications from transactions array ──── */
const buildNotifs = (txns) => {
  try {
    const notifs = [];

    txns.forEach((t) => {
      const paid = ['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(t.status);
      const dueStr = t.dueDate || t.date;
      const diff = daysDiff(dueStr);
      const name = (t.name || '') + (t.lastName ? ' ' + t.lastName : '');

      if (paid) {
        notifs.push({
          id: 'suc_' + t._id, cat: 'success', urgent: false,
          icon: '✅', color: '#10b981', border: '#10b981', bg: 'rgba(16,185,129,0.09)',
          title: 'Payment Received',
          body: name + ' — ' + fmtAmt(t.amount),
          sub: t.emiPaidDate ? 'Paid: ' + fmtDate(t.emiPaidDate) : 'Entry: ' + fmtDate(t.date),
          time: t.emiPaidDate || t.date,
        });
        return;
      }

      if (diff !== null && diff < 0) {
        notifs.push({
          id: 'del_' + t._id, cat: 'delayed', urgent: true,
          icon: '⚠️', color: '#ef4444', border: '#ef4444', bg: 'rgba(239,68,68,0.09)',
          title: 'Overdue by ' + Math.abs(diff) + ' day' + (Math.abs(diff) > 1 ? 's' : ''),
          body: name + ' — ' + fmtAmt(t.amount),
          sub: 'Was due ' + fmtDate(dueStr),
          time: dueStr,
        });
        return;
      }

      if (diff !== null && diff >= 0 && diff <= 14) {
        var when = diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow!' : 'in ' + diff + ' days';
        notifs.push({
          id: 'up_' + t._id, cat: 'upcoming', urgent: diff <= 2,
          icon: diff <= 2 ? '🔔' : '📅',
          color: diff <= 2 ? '#f59e0b' : '#6366f1',
          border: diff <= 2 ? '#f59e0b' : '#6366f1',
          bg: diff <= 2 ? 'rgba(245,158,11,0.09)' : 'rgba(99,102,241,0.09)',
          title: 'Due ' + when,
          body: name + ' — ' + fmtAmt(t.amount),
          sub: 'Due Date: ' + fmtDate(dueStr),
          time: dueStr,
        });
        return;
      }

      if (!paid) {
        notifs.push({
          id: 'pen_' + t._id, cat: 'pending', urgent: false,
          icon: '🕐', color: '#f59e0b', border: '#f59e0b', bg: 'rgba(245,158,11,0.07)',
          title: 'Pending Payment',
          body: name + ' — ' + fmtAmt(t.amount),
          sub: dueStr ? 'Due: ' + fmtDate(dueStr) : 'No due date',
          time: dueStr || t.date,
        });
      }
    });

    notifs.sort(function(a, b) {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(a.time || 0) - new Date(b.time || 0);
    });

    return notifs;
  } catch (e) {
    console.error('NotificationBell error:', e);
    return [];
  }
};

const TABS = ['all', 'pending', 'success', 'delayed', 'upcoming'];
const TAB_LABELS = { all: '🔔 All', pending: '🕐 Pending', success: '✅ Success', delayed: '⚠️ Delayed', upcoming: '📅 Upcoming' };

/* ─── Component ───────────────────────────────────────────── */
const NotificationBell = ({ transactions = [] }) => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [dismissed, setDismissed] = useState(function() {
    try {
      return JSON.parse(localStorage.getItem('notif_dis') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [tab, setTab] = useState('all');
  const dropRef = useRef(null);

  // Load notifications
  const reload = () => {
    var n = buildNotifs(transactions);
    setNotifs(n);
  };

  useEffect(function() {
    reload();
  }, [transactions]);

  // Outside click
  useEffect(function() {
    if (!open) return;
    var fn = function(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return function() { document.removeEventListener('mousedown', fn); };
  }, [open]);

  var saveDis = function(arr) {
    setDismissed(arr);
    localStorage.setItem('notif_dis', JSON.stringify(arr));
  };

  var visible = notifs.filter(function(n) { return dismissed.indexOf(n.id) === -1; });
  var filtered = tab === 'all' ? visible : visible.filter(function(n) { return n.cat === tab; });
  var urgentCount = visible.filter(function(n) { return n.urgent; }).length;
  var totalCount = visible.length;

  var counts = {};
  TABS.forEach(function(k) {
    counts[k] = k === 'all' ? visible.length : visible.filter(function(n) { return n.cat === k; }).length;
  });

  return (
    <div ref={dropRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>

      {/* Bell Button */}
      <button
        className="btn btn-link p-0 position-relative"
        style={{ color: 'var(--text-main)', outline: 'none', border: 'none' }}
        onClick={function() { reload(); setOpen(function(o) { return !o; }); }}
        title="Notifications"
      >
        <MdNotifications size={24} />
        {totalCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -5,
            background: urgentCount > 0 ? '#ef4444' : '#6366f1',
            color: '#fff', borderRadius: '50%',
            fontSize: '0.58rem', fontWeight: 'bold',
            width: 17, height: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-card, #fff)',
          }}>
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'fixed',
          top: 60, right: 16,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-card, #fff)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          border: '1px solid var(--border-color, #e5e7eb)',
          zIndex: 99999,
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdNotifications color="#fff" size={18} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Notifications</span>
              {urgentCount > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff',
                  borderRadius: 20, fontSize: 9, padding: '1px 6px', fontWeight: 700,
                }}>
                  {urgentCount} URGENT
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {visible.length > 0 && (
                <button
                  onClick={function() { saveDis(notifs.map(function(n) { return n.id; })); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                >Clear all</button>
              )}
              {dismissed.length > 0 && (
                <button
                  onClick={function() { saveDis([]); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                >Restore</button>
              )}
              <button
                onClick={function() { setOpen(false); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', lineHeight: 1, padding: 0 }}
              >
                <MdClose size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', overflowX: 'auto', padding: '6px 6px 0', gap: 3,
            borderBottom: '1px solid var(--border-color, #e5e7eb)',
          }}>
            {TABS.map(function(k) {
              return (
                <button
                  key={k}
                  onClick={function() { setTab(k); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    padding: '5px 9px', borderRadius: '7px 7px 0 0',
                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: 11, fontWeight: 600,
                    background: tab === k ? '#6366f1' : 'transparent',
                    color: tab === k ? '#fff' : '#6b7280',
                  }}
                >
                  {TAB_LABELS[k]}
                  {counts[k] > 0 && (
                    <span style={{
                      background: tab === k ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                      color: tab === k ? '#fff' : '#374151',
                      borderRadius: 10, fontSize: 9, padding: '0 5px', fontWeight: 700,
                    }}>{counts[k]}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 350, overflowY: 'auto', padding: '6px 0' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: '#9ca3af' }}>
                <MdCheckCircle size={32} style={{ opacity: 0.3, marginBottom: 6 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>All clear!</div>
                <div style={{ fontSize: 11 }}>No notifications here.</div>
              </div>
            ) : (
              filtered.map(function(n) {
                return (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      margin: '3px 7px', padding: '9px 10px',
                      borderRadius: 10, background: n.bg,
                      borderLeft: '3px solid ' + n.border,
                    }}
                  >
                    <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{n.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: n.color }}>{n.title}</div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-main, #111827)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{n.sub}</div>
                    </div>
                    <button
                      onClick={function() { saveDis(dismissed.concat([n.id])); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0, flexShrink: 0, lineHeight: 1 }}
                      title="Dismiss"
                    >
                      <MdClose size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '7px 14px', borderTop: '1px solid var(--border-color, #e5e7eb)',
            textAlign: 'center', fontSize: 10, color: '#9ca3af',
          }}>
            {totalCount} notifications · refreshes every 5 min
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
