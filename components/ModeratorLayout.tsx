'use client';

import React from 'react';

interface ModeratorLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  subtitle?: string;
  subtitleDescription?: string;
  className?: string;
}

export default function ModeratorLayout({ 
  children, 
  title, 
  description,
  subtitle,
  subtitleDescription,
  className = ""
}: ModeratorLayoutProps) {
  return (
    <div className={`p-3 sm:p-4 md:p-6 max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-default-500">{description}</p>
      </div>
      
      <div className="space-y-4 md:space-y-6">
        {subtitle && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{subtitle}</h2>
              {subtitleDescription && (
                <p className="text-default-500 text-sm">{subtitleDescription}</p>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
