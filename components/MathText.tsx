import React, { useEffect, useRef } from 'react';

interface MathTextProps {
  text: string;
  className?: string;
}

declare global {
  interface Window {
    MathJax: any;
  }
}

const MathText: React.FC<MathTextProps> = ({ text, className = "" }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let isMounted = true;

    const typeset = async () => {
      if (!text || !containerRef.current) return;

      // Check if MathJax is available
      if (typeof window.MathJax === 'undefined') {
        console.warn('MathJax is not loaded. Displaying raw text.');
        return;
      }

      // Wait for MathJax startup if needed
      if (window.MathJax.startup && window.MathJax.startup.promise) {
        try {
          await window.MathJax.startup.promise;
        } catch (e) {
           console.warn('MathJax startup failed:', e);
           // Fallback is implicit as the raw text is already in the DOM via React
           return;
        }
      }

      if (!isMounted) return;

      // 1. Reset content to raw text to ensure clean slate for MathJax
      // This is crucial if re-rendering or retrying
      containerRef.current.innerText = text;

      // 2. Instruct MathJax to typeset this specific element
      try {
        await window.MathJax.typesetPromise([containerRef.current]);
      } catch (err) {
        console.warn('MathJax typesetting failed:', err);
        // Fallback: Revert to raw text
        if (isMounted && containerRef.current) {
           containerRef.current.innerText = text; 
        }
      }
    };

    typeset();

    return () => {
      isMounted = false;
    };
  }, [text]);

  return (
    <span 
      ref={containerRef} 
      className={`math-text ${className} break-words`}
    >
      {text}
    </span>
  );
};

export default MathText;