import React from 'react';

// Default payment apps with brand colors and SVG logos
export const DEFAULT_APPS = [
  {
    id: 'PhonePe',
    label: 'PhonePe',
    color: '#5f259f',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#5f259f"/>
        <path d="M12 12h4l6 10v-10h3.5v16H22l-6-10v10H12.5V12z" fill="#fff"/>
      </svg>
    )
  },
  {
    id: 'Google Pay',
    label: 'Google Pay',
    color: '#4285F4',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
        <text x="20" y="26" textAnchor="middle" fill="#4285F4" fontSize="16" fontWeight="bold" fontFamily="Arial">G</text>
        <rect x="14" y="28" width="4" height="2" rx="1" fill="#FBBC05"/>
        <rect x="18" y="28" width="4" height="2" rx="1" fill="#34A853"/>
        <rect x="22" y="28" width="4" height="2" rx="1" fill="#EA4335"/>
      </svg>
    )
  },
  {
    id: 'Paytm',
    label: 'Paytm',
    color: '#00BAF2',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#00BAF2"/>
        <text x="20" y="25" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">Pay</text>
      </svg>
    )
  },
  {
    id: 'Amazon Pay',
    label: 'Amazon Pay',
    color: '#FF9900',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
        <text x="20" y="24" textAnchor="middle" fill="#000" fontSize="12" fontWeight="bold" fontFamily="Arial">amazon</text>
        <path d="M10 28c5 4 14 4 18 0" stroke="#FF9900" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M28 28l2 2v-3" stroke="#FF9900" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'BHIM',
    label: 'BHIM',
    color: '#FF7000',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
        <path d="M12 20h16M20 12v16" stroke="#FF7000" strokeWidth="3" opacity="0.3"/>
        <text x="20" y="26" textAnchor="middle" fill="#FF7000" fontSize="14" fontWeight="bold" fontFamily="Arial">BHIM</text>
      </svg>
    )
  },
  {
    id: 'WhatsApp Pay',
    label: 'WhatsApp',
    color: '#25D366',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#25D366"/>
        <path d="M20 10a10 10 0 0 0-8.6 15l-1.4 4.1 4.3-1.4A10 10 0 1 0 20 10zm0 18a8 8 0 0 1-4.1-1.1l-2.6.9.9-2.5A8 8 0 1 1 20 28zm3.6-4.6c-.2-.1-1.2-.6-1.4-.6-.2 0-.3 0-.4.2s-.5.6-.6.8c-.1.2-.2.2-.4.1-.2-.1-.8-.3-1.6-.9-.6-.5-1-1.2-1.1-1.3-.1-.2 0-.3.1-.4l.3-.3.2-.4c0-.1 0-.3-.1-.4-.1-.2-.4-1-.6-1.4-.2-.3-.3-.3-.4-.3h-.3c-.1 0-.3 0-.5.2-.2.2-.7.7-.7 1.7s.7 2 1.2 2.6c.5.6 1.8 2.7 4.3 3.8h.1c.9.3 1.7.3 2.3.2.7-.1 1.2-.5 1.4-1 .1-.5.1-.9 0-1-.1-.1-.3-.2-.5-.3z" fill="#fff"/>
      </svg>
    )
  },
  {
    id: 'CRED',
    label: 'CRED',
    color: '#222222',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#222222"/>
        <circle cx="20" cy="20" r="8" fill="none" stroke="#fff" strokeWidth="3"/>
        <path d="M20 12v16" stroke="#fff" strokeWidth="3"/>
      </svg>
    )
  },
  {
    id: 'Mobikwik',
    label: 'Mobikwik',
    color: '#004182',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#004182"/>
        <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="Arial">M</text>
      </svg>
    )
  },
  {
    id: 'Bank Transfer',
    label: 'Bank',
    color: '#1a73e8',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#1a73e8"/>
        <path d="M20 10l10 6H10l10-6z" fill="#fff"/>
        <rect x="13" y="18" width="3" height="8" rx="0.5" fill="#fff"/>
        <rect x="18.5" y="18" width="3" height="8" rx="0.5" fill="#fff"/>
        <rect x="24" y="18" width="3" height="8" rx="0.5" fill="#fff"/>
        <rect x="10" y="27" width="20" height="2.5" rx="1" fill="#fff"/>
      </svg>
    )
  },
  {
    id: 'Debit Card',
    label: 'Debit Card',
    color: '#ff6f00',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#ff6f00"/>
        <rect x="8" y="12" width="24" height="16" rx="3" fill="#fff"/>
        <rect x="8" y="17" width="24" height="4" fill="#ff6f00" opacity="0.7"/>
        <rect x="11" y="24" width="8" height="2" rx="1" fill="#ccc"/>
      </svg>
    )
  }
];

export const CUSTOM_COLORS = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#009688', '#ff5722', '#795548', '#607d8b'];

export const getCustomApps = () => JSON.parse(localStorage.getItem('customPaymentApps') || '[]');
export const saveCustomApps = (apps) => localStorage.setItem('customPaymentApps', JSON.stringify(apps));

export const getAllPaymentApps = () => {
  const customApps = getCustomApps();
  return [
    ...DEFAULT_APPS,
    ...customApps.map((app, i) => ({
      id: app.name,
      label: app.name,
      color: app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length],
      logo: (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <rect width="40" height="40" rx="10" fill={app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length]}/>
          <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="Arial">
            {app.name.charAt(0).toUpperCase()}
          </text>
        </svg>
      )
    }))
  ];
};

export const getAppDetails = (appName) => {
  if (!appName || appName === 'Cash') {
    return {
      id: 'Cash', label: 'Cash', color: '#2e7d32',
      logo: (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <rect width="40" height="40" rx="10" fill="#2e7d32"/>
          <rect x="8" y="12" width="24" height="16" rx="3" fill="#fff"/>
          <circle cx="20" cy="20" r="5" fill="#2e7d32" opacity="0.3"/>
          <text x="20" y="23" textAnchor="middle" fill="#2e7d32" fontSize="8" fontWeight="bold" fontFamily="Arial">₹</text>
        </svg>
      )
    };
  }
  const allApps = getAllPaymentApps();
  const app = allApps.find(a => a.id.toLowerCase() === appName.toLowerCase() || a.label.toLowerCase() === appName.toLowerCase());
  return app || {
    id: appName, label: appName, color: '#607d8b',
    logo: (
      <svg viewBox="0 0 40 40" width="28" height="28">
        <rect width="40" height="40" rx="10" fill="#607d8b"/>
        <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="Arial">
          {appName.charAt(0).toUpperCase()}
        </text>
      </svg>
    )
  };
};
