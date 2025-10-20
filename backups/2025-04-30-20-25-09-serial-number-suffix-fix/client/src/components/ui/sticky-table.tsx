import React from 'react';

interface StickyTableProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyTable({ children, className = '' }: StickyTableProps) {
  return (
    <div className={`sticky-table-container ${className}`}>
      <style jsx>{`
        .sticky-table-container {
          height: calc(100vh - 130px);
          overflow: auto;
          position: relative;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(229, 231, 235);
          background-color: white;
        }
        
        .sticky-table-container :global(table) {
          width: 100%;
          border-collapse: collapse;
        }
        
        .sticky-table-container :global(thead) {
          position: sticky;
          top: 0;
          z-index: 40;
        }
        
        .sticky-table-container :global(th) {
          background-color: #015a6c;
          color: white;
          position: sticky;
          top: 0;
          z-index: 30;
        }
        
        /* Special styling for the first column header (corner cell) */
        .sticky-table-container :global(th:first-child) {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 50;  /* Highest z-index to appear above everything */
        }
        
        /* Make the first column of data sticky horizontally */
        .sticky-table-container :global(td:first-child) {
          position: sticky;
          left: 0;
          z-index: 20;
        }
      `}</style>
      {children}
    </div>
  );
}