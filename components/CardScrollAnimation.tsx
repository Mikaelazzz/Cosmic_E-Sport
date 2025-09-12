"use client"
import React, { useEffect, useRef } from 'react';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CardScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

const CardScrollAnimation: React.FC<CardScrollAnimationProps> = ({ 
  children, 
  className = "",
  animationDuration = 1,
  ease = "back.inOut(2)",
  scrollStart = "top bottom-=100px",
  scrollEnd = "bottom top+=100px",
  stagger = 0.2
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.card-animate');
    // Reset all cards to initial state
    gsap.set(cards, {
      opacity: 0,
      y: 100,
      rotationX: 15,
      scale: 0.8,
      transformOrigin: "center center"
    });

    // Batch animation for each card
    ScrollTrigger.batch(cards, {
      start: scrollStart,
      end: scrollEnd,
      onEnter: batch => gsap.to(batch, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: animationDuration,
        ease: ease,
        stagger: {
          each: stagger,
          amount: batch.length * stagger
        }
      }),
      onLeave: batch => gsap.to(batch, {
        opacity: 0,
        y: -100,
        rotationX: -15,
        scale: 0.8,
        duration: animationDuration,
        ease: ease,
        stagger: {
          each: stagger,
          amount: batch.length * stagger
        }
      }),
      onEnterBack: batch => gsap.to(batch, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: animationDuration,
        ease: ease,
        stagger: {
          each: stagger,
          amount: batch.length * stagger
        }
      }),
      onLeaveBack: batch => gsap.to(batch, {
        opacity: 0,
        y: 100,
        rotationX: 15,
        scale: 0.8,
        duration: animationDuration,
        ease: ease,
        stagger: {
          each: stagger,
          amount: batch.length * stagger
        }
      })
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [children, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <div ref={containerRef} className={`scroll-animate-cards ${className}`} style={{ perspective: '1000px' }}>
      {children}
    </div>
  );
};

export default CardScrollAnimation;
