'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type CardRailVariant = 'compact' | 'default' | 'comfortable';

interface CardRailProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  variant?: CardRailVariant;
}

export const CardRail = React.forwardRef<HTMLDivElement, CardRailProps>(function CardRail({
  children,
  className,
  itemClassName,
  variant = 'default',
}, forwardedRef) {
  const items = React.Children.toArray(children);
  const railRef = React.useRef<HTMLDivElement>(null);
  const dragStateRef = React.useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    dragDistance: 0,
  });
  const suppressClickRef = React.useRef(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const stopDragging = React.useCallback(() => {
    const dragState = dragStateRef.current;

    suppressClickRef.current = dragState.dragDistance > 6;
    dragState.active = false;
    dragState.dragDistance = 0;
    setIsDragging(false);
  }, []);

  const startDragging = React.useCallback((clientX: number) => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: clientX,
      startScrollLeft: rail.scrollLeft,
      dragDistance: 0,
    };
    suppressClickRef.current = false;
    setIsDragging(true);
  }, []);

  const moveDragging = React.useCallback((clientX: number) => {
    const rail = railRef.current;
    const dragState = dragStateRef.current;
    if (!rail || !dragState.active) {
      return;
    }

    const deltaX = clientX - dragState.startX;
    dragState.dragDistance = Math.max(dragState.dragDistance, Math.abs(deltaX));
    rail.scrollLeft = dragState.startScrollLeft - deltaX;
  }, []);

  React.useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleWindowMouseMove = (event: MouseEvent) => {
      moveDragging(event.clientX);
    };

    const handleWindowMouseUp = () => {
      stopDragging();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, moveDragging, stopDragging]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    startDragging(event.clientX);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
    startDragging(event.touches[0].clientX);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active || event.touches.length !== 1) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
    moveDragging(event.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    stopDragging();
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) {
      return;
    }

    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={(node) => {
        railRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      className={cn('media-rail', isDragging ? 'cursor-grabbing select-none' : 'cursor-grab', className)}
      data-rail-variant={variant}
      onMouseDownCapture={handleMouseDown}
      onMouseLeave={() => {
        if (dragStateRef.current.active) {
          stopDragging();
        }
      }}
      onTouchStartCapture={handleTouchStart}
      onTouchMoveCapture={handleTouchMove}
      onTouchEndCapture={handleTouchEnd}
      onTouchCancelCapture={handleTouchEnd}
      onClickCapture={handleClickCapture}
      onDragStart={(event) => event.preventDefault()}
    >
      {items.map((child, index) => (
        <div key={index} className={cn('media-rail-item', itemClassName)}>
          {child}
        </div>
      ))}
    </div>
  );
});
