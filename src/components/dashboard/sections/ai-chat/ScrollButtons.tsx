
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ScrollButtonsProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function ScrollButtons({ containerRef }: ScrollButtonsProps) {
  const [showButtons, setShowButtons] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atTop = scrollTop <= 10;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      setIsAtTop(atTop);
      setIsAtBottom(atBottom);
      setShowButtons(scrollHeight > clientHeight + 50); // Show if content is scrollable
    };

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    
    // Also check when content changes
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (!showButtons) return null;

  return (
    <div className="fixed right-6 bottom-20 flex flex-col gap-2 z-10">
      {!isAtTop && (
        <Button
          size="icon"
          variant="outline"
          onClick={scrollToTop}
          className="h-10 w-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
      {!isAtBottom && (
        <Button
          size="icon"
          variant="outline"
          onClick={scrollToBottom}
          className="h-10 w-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
