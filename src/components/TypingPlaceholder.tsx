import React, { useState, useEffect } from 'react';

interface TypingPlaceholderProps {
  texts: string[];
  isActive: boolean;
  speed?: number;
  pauseDuration?: number;
  className?: string;
}

export function TypingPlaceholder({ 
  texts, 
  isActive, 
  speed = 100, 
  pauseDuration = 2000,
  className = ""
}: TypingPlaceholderProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!isActive || texts.length === 0) {
      setCurrentText('');
      return;
    }

    const currentFullText = texts[currentTextIndex];

    const timeout = setTimeout(() => {
      if (isTyping) {
        // Typing phase
        if (charIndex < currentFullText.length) {
          setCurrentText(currentFullText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Finished typing, pause then start erasing
          setIsTyping(false);
          setTimeout(() => {
            setCharIndex(charIndex - 1);
          }, pauseDuration);
        }
      } else {
        // Erasing phase
        if (charIndex > 0) {
          setCurrentText(currentFullText.substring(0, charIndex));
          setCharIndex(charIndex - 1);
        } else {
          // Finished erasing, move to next text
          setIsTyping(true);
          setCurrentTextIndex((prevIndex) => 
            prevIndex === texts.length - 1 ? 0 : prevIndex + 1
          );
          setCharIndex(0);
        }
      }
    }, isTyping ? speed : speed / 2);

    return () => clearTimeout(timeout);
  }, [charIndex, isTyping, currentTextIndex, texts, speed, pauseDuration, isActive]);

  // Reset when isActive changes
  useEffect(() => {
    if (!isActive) {
      setCurrentText('');
      setCharIndex(0);
      setIsTyping(true);
      setCurrentTextIndex(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
}