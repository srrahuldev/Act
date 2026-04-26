import React, { useState, useEffect } from 'react';

const AnimatedNumber = ({ 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 0, 
  duration = 1.0, 
  isCurrency = false 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Attempt to parse string/number
    // e.g. "1,25,000" or 125000
    let target = 0;
    if (typeof value === 'string') {
        target = Number(value.replace(/[^0-9.-]+/g,""));
    } else {
        target = Number(value);
    }
    
    if (isNaN(target)) {
        setDisplayValue(value);
        return;
    }

    const frameRate = 1000 / 60; // 60fps
    const totalFrames = Math.round((duration * 1000) / frameRate);
    let frame = 0;

    // smooth easeOutExpo easing
    const easeOutExpo = (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

    const counter = setInterval(() => {
      frame++;
      const progress = easeOutExpo(frame / totalFrames);
      const currentVal = target * progress;

      if (frame >= totalFrames) {
        clearInterval(counter);
        setDisplayValue(target);
      } else {
        setDisplayValue(currentVal);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [value, duration]);

  const formatNumber = (num) => {
    if (typeof num === 'string') return num;
    
    if (isCurrency) {
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    // simple number with decimals
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
  };

  return (
    <span style={{
        display: 'inline-block',
        animation: 'numberScaleUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
    }}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
};

export default AnimatedNumber;
