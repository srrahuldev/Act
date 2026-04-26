import React, { useState, useEffect } from 'react';
import { MdArrowUpward, MdArrowDownward } from 'react-icons/md';

const ScrollArrows = () => {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Check for UP arrow visibility
      if (window.scrollY > 300) {
        setShowUp(true);
      } else {
        setShowUp(false);
      }

      // Check for DOWN arrow visibility
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 50) {
        setShowDown(false);
      } else {
        setShowDown(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="scroll-arrows-container">
      {showUp && (
        <button
          onClick={scrollToTop}
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center"
          style={{ width: "45px", height: "45px", transition: "all 0.3s ease", zIndex: 1050 }}
          title="Scroll to Top"
        >
          <MdArrowUpward size={24} />
        </button>
      )}

      {showDown && (
        <button
          onClick={scrollToBottom}
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center mt-2"
          style={{ width: "45px", height: "45px", transition: "all 0.3s ease", zIndex: 1050 }}
          title="Scroll to Bottom"
        >
          <MdArrowDownward size={24} />
        </button>
      )}

      <style>{`
        .scroll-arrows-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 9999;
        }

        @media (max-width: 768px) {
          .scroll-arrows-container {
            bottom: 20px;
            right: 20px;
          }
          .scroll-arrows-container button {
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollArrows;
