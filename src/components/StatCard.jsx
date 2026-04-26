import React from 'react';

const StatCard = ({ title, value, prefix, suffix, icon, colorClass, description }) => {
  return (
    <div className={`card modern-card border-0 h-100`}>
      <div className={`card-header bg-transparent border-0 pt-4 pb-0 d-flex justify-content-between align-items-center`}>
        <h6 className="text-muted text-uppercase mb-0 fw-bold" style={{ fontSize: '0.85rem' }}>{title}</h6>
        <div className={`d-flex align-items-center justify-content-center rounded bg-opacity-10 bg-${colorClass} text-${colorClass}`} style={{ width: 40, height: 40 }}>
          {icon}
        </div>
      </div>
      <div className="card-body pt-2 pb-4">
        <h3 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>
            {prefix}{value}{suffix}
        </h3>
        <p className="text-muted small mb-0 d-flex align-items-center mt-2">
            <span className={`text-${colorClass} bg-${colorClass} bg-opacity-10 px-2 py-1 rounded me-2 fw-semibold`}>
                {description}
            </span>
            vs last month
        </p>
      </div>
      {/* Subtle bottom border gradient */}
      <div 
        style={{ 
            height: '4px', 
            width: '100%', 
            background: `linear-gradient(90deg, var(--bs-${colorClass}), transparent)`,
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
        }} 
      />
    </div>
  );
};

export default StatCard;
