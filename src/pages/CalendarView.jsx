import React, { useState, useEffect, useMemo } from 'react';
import { MdChevronLeft, MdChevronRight, MdToday, MdWarning } from 'react-icons/md';
import { fetchTransactions } from '../api';
import AnimatedSection from '../components/AnimatedSection';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchTransactions();
        setTransactions(res.data);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map transactions to days
  const eventsByDay = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dateKey = d.getDate();
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(t);
      }
      
      // Also map Due Dates for EMIs
      if (t.type === 'EMI' && t.dueDate && t.status === 'Pending') {
        const dueD = new Date(t.dueDate);
        if (dueD.getFullYear() === year && dueD.getMonth() === month) {
          const dueKey = dueD.getDate();
          if (!map[dueKey]) map[dueKey] = [];
          // Avoid duplicating if date and dueDate are same day
          if (dueD.getDate() !== d.getDate()) {
            map[dueKey].push({...t, isDueAlert: true});
          }
        }
      }
    });
    return map;
  }, [transactions, year, month]);

  const paddedDays = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  
  // padding end to complete exactly 35 or 42 grid cells
  const totalCells = paddedDays.length > 35 ? 42 : 35;
  while(paddedDays.length < totalCells) paddedDays.push(null);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDay = today.getDate();

  return (
    <AnimatedSection delay={100}>
    <div className="container-fluid py-4 px-3 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Smart Calendar</h2>
          <p className="text-muted mb-0">Track all your transactions & EMI due dates visually.</p>
        </div>
        <div className="d-flex gap-2">
          {loading && <div className="spinner-border text-primary spinner-border-sm mt-2"></div>}
        </div>
      </div>

      <div className="card modern-card overflow-hidden shadow-sm border-0">
        {/* Calendar Header */}
        <div className="card-header bg-white p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 border-bottom" style={{ borderColor: 'var(--border-color) !important' }}>
          <button className="btn btn-sm btn-outline-primary fw-bold text-uppercase d-flex align-items-center px-3 rounded-pill" style={{ letterSpacing: 1 }} onClick={goToToday}>
            <MdToday size={18} className="me-2" /> Today
          </button>
          
          <div className="d-flex align-items-center gap-2 gap-md-4">
            <button className="btn btn-light rounded-circle p-2 hover-scale d-flex align-items-center justify-content-center" onClick={prevMonth}><MdChevronLeft size={24} /></button>
            <h4 className="mb-0 fw-bold" style={{ color: 'var(--text-main)', minWidth: '180px', textAlign: 'center' }}>
              {monthName}
            </h4>
            <button className="btn btn-light rounded-circle p-2 hover-scale d-flex align-items-center justify-content-center" onClick={nextMonth}><MdChevronRight size={24} /></button>
          </div>
          
          <div className="d-flex gap-2 small fw-semibold text-muted">
             <span className="d-flex align-items-center gap-1"><div style={{width:10,height:10,background:'#10b981',borderRadius:'50%'}}></div> Income</span>
             <span className="d-flex align-items-center gap-1"><div style={{width:10,height:10,background:'#ef4444',borderRadius:'50%'}}></div> Expense</span>
             <span className="d-flex align-items-center gap-1"><div style={{width:10,height:10,background:'#f59e0b',borderRadius:'50%'}}></div> Due EMI</span>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="p-0 bg-light bg-opacity-10">
          {/* Days Header */}
          <div className="row g-0 border-bottom text-center fw-bold text-muted py-2 text-uppercase mb-0" style={{ fontSize: '0.8rem', letterSpacing: 1 }}>
            {daysOfWeek.map(day => (
              <div className="col" key={day} style={{ color: day === 'Sun' ? '#ef4444' : '' }}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="d-flex flex-wrap" style={{ borderLeft: '1px solid var(--border-color)'}}>
            {paddedDays.map((day, index) => {
              const isToday = isCurrentMonth && day === currentDay;
              const dayEvents = day ? eventsByDay[day] || [] : [];
              
              // Calculate daily summary
              let income = 0;
              let expense = 0;
              let hasDue = false;

              dayEvents.forEach(e => {
                if (e.isDueAlert || (e.type === 'EMI' && e.status === 'Pending')) hasDue = true;
                if (!e.isDueAlert) {
                  if (e.type === 'Credit') income += Number(e.amount);
                  else expense += Number(e.amount);
                }
              });

              return (
                <div 
                  key={index}
                  className="p-1 p-md-2 position-relative d-flex flex-column"
                  style={{ 
                    width: '14.28%', 
                    height: window.innerWidth > 768 ? '140px' : '100px', 
                    borderRight: '1px solid var(--border-color)', 
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isToday ? 'rgba(13, 110, 253, 0.05)' : day ? '#fff' : '#f8f9fa',
                    transition: 'all 0.2s',
                    cursor: day ? 'pointer' : 'default'
                  }}
                  onMouseEnter={(e) => { if(day) e.currentTarget.style.backgroundColor = 'rgba(13, 110, 253, 0.02)'; }}
                  onMouseLeave={(e) => { if(day) e.currentTarget.style.backgroundColor = isToday ? 'rgba(13, 110, 253, 0.05)' : '#fff'; }}
                >
                  {day && (
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div 
                           className={`d-flex justify-content-center align-items-center rounded-circle shadow-sm 
                           ${isToday ? 'bg-primary text-white scale-up' : 'bg-light text-dark'}`} 
                           style={{ width: '28px', height: '28px', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          {day}
                        </div>
                        {hasDue && <MdWarning className="text-warning flash-animation" size={18} title="Pending EMI Due!" />}
                      </div>

                      {/* Summary Indicators for Mobile */}
                      <div className="d-md-none d-flex gap-1 justify-content-center mt-auto pb-1">
                         {income > 0 && <div style={{width:6,height:6,background:'#10b981',borderRadius:'50%'}}></div>}
                         {expense > 0 && <div style={{width:6,height:6,background:'#ef4444',borderRadius:'50%'}}></div>}
                         {hasDue && <div style={{width:6,height:6,background:'#f59e0b',borderRadius:'50%'}}></div>}
                      </div>

                      {/* Detailed Events for Desktop */}
                      <div className="d-none d-md-flex flex-column gap-1 overflow-auto custom-scrollbar" style={{ flex: 1 }}>
                        {dayEvents.map((event, i) => (
                           <div 
                             key={i} 
                             className={`rounded px-2 py-1 text-truncate border-start border-3 small shadow-sm`}
                             style={{ 
                               fontSize: '11px', 
                               backgroundColor: event.isDueAlert ? 'rgba(245, 158, 11, 0.1)' : event.type === 'Credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                               borderLeftColor: event.isDueAlert ? '#f59e0b' : event.type === 'Credit' ? '#10b981' : '#ef4444',
                               color: 'var(--text-main)',
                               fontWeight: 500
                             }}
                             title={`${event.isDueAlert ? 'DUE: ' : ''}${event.name} - ₹${Number(event.amount).toLocaleString('en-IN')}`}
                           >
                              {event.isDueAlert ? 
                                <><MdWarning className="text-warning me-1"/> EMI Due</> : 
                                <><span className="fw-bold text-dark">₹{Number(event.amount).toLocaleString('en-IN')}</span> {event.name}</>
                              }
                           </div>
                        ))}
                      </div>

                      {/* Daily Net Summary (Desktop only) */}
                      {(income > 0 || expense > 0) && (
                         <div className="d-none d-md-flex justify-content-between mt-auto pt-1 border-top" style={{fontSize: '10px'}}>
                            <span className="text-success fw-bold">+{income > 1000 ? (income/1000).toFixed(1)+'k' : income}</span>
                            <span className="text-danger fw-bold">-{expense > 1000 ? (expense/1000).toFixed(1)+'k' : expense}</span>
                         </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .scale-up { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .flash-animation { animation: flash 2s infinite; }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; text-shadow: 0 0 8px rgba(245,158,11,0.8); } }
      `}</style>
    </div>
    </AnimatedSection>
  );
};

export default CalendarView;
