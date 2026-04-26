import React from 'react';
import { useInView } from '../hooks/useInView';

const AnimatedSection = ({ children, delay = 0, className = '' }) => {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${isInView ? 'active' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, height: '100%' }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
