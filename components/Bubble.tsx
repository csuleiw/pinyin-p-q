import React, { useState } from 'react';
import { PinyinItem } from '../types';

interface BubbleProps {
  item: PinyinItem;
  onClick: (item: PinyinItem) => void;
  disabled: boolean;
}

const Bubble: React.FC<BubbleProps> = ({ item, onClick, disabled }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shake, setShake] = useState(false);

  const handleClick = () => {
    if (disabled || item.isFound) return;
    
    if (item.isTarget) {
        setIsAnimating(true);
    } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }
    
    onClick(item);
  };

  if (item.isFound) {
    return <div className="w-24 h-24 m-2" />; // Placeholder to keep layout stable
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative w-24 h-24 m-2 md:w-32 md:h-32 
        bg-white rounded-full shadow-lg border-4 
        flex items-center justify-center 
        transition-all duration-200
        bubble-pop
        hover:scale-105 active:scale-95
        ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}
        ${isAnimating ? 'opacity-0 scale-150' : 'opacity-100'}
        ${item.isTarget ? 'border-indigo-100 hover:border-indigo-300' : 'border-gray-100 hover:border-red-100'}
      `}
      style={{
        transform: `rotate(${item.rotation}deg)`,
      }}
    >
      <span 
        className={`font-bold select-none ${item.colorClass} ${item.sizeClass}`}
        style={{ fontFamily: '"Fredoka", sans-serif' }}
      >
        {item.text}
      </span>
      {/* Loading/Speaking indicator could go here if needed, but we want it clean */}
    </button>
  );
};

export default Bubble;