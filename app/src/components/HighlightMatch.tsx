'use client';

import React from 'react';

interface HighlightMatchProps {
  text: string;
  query?: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Escapes regex special characters to prevent regex injection errors
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Civic Search Match Highlighting Component
 * Highlights matched query terms cleanly in yellow/amber tint without altering layout.
 */
export default function HighlightMatch({
  text,
  query,
  className = '',
  highlightClassName = 'bg-[#FEF08A] text-[#854D0E] font-semibold px-0.5 rounded-xs',
}: HighlightMatchProps) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map(escapeRegExp);

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create regex that captures any matching term
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = terms.some((term) => new RegExp(`^${term}$`, 'i').test(part));
        if (isMatch) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
