"use client";

import { useState } from "react";
import { QueryResult } from "@/lib/db";

interface ResultsTableProps {
  result: QueryResult | null;
  error?: string;
  isLoading?: boolean;
}

export function ResultsTable({ result, error, isLoading }: ResultsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Executing query...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 w-full max-w-lg">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-destructive mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <h3 className="font-semibold text-destructive">Query Error</h3>
              <p className="text-sm text-destructive/80 mt-1 whitespace-pre-wrap">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p>Run a query to see results</p>
        </div>
      </div>
    );
  }

  if (result.rowCount === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
          <p>Query executed successfully</p>
          <p className="text-sm mt-1">No rows returned</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          {result.rowCount} {result.rowCount === 1 ? "row" : "rows"} returned
        </span>
        <button
          onClick={() => setExpandedRow(expandedRow === -1 ? null : -1)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            expandedRow === -1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          {expandedRow === -1 ? "Collapse All" : "Expand All"}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="w-10 px-1 py-2 border-b border-r border-border"></th>
              {result.columns.map((column, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium text-foreground border-b border-r border-border whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIndex) => (
              <>
                <tr
                  key={rowIndex}
                  className="hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => setExpandedRow(expandedRow === rowIndex ? null : rowIndex)}
                >
                  <td className="px-1 py-1 border-b border-r border-border text-center">
                    <div className="flex items-center justify-center w-6">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expandedRow === rowIndex || expandedRow === -1 ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`}
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </td>
                  {result.columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-4 py-2 border-b border-r border-border text-muted-foreground whitespace-nowrap max-w-xs truncate"
                    >
                      {formatValue(row[column])}
                    </td>
                  ))}
                </tr>
                {(expandedRow === rowIndex || expandedRow === -1) && (
                  <tr key={`${rowIndex}-expanded`} className="bg-muted/30">
                    <td className="border-b border-r border-border"></td>
                    <td colSpan={result.columns.length} className="p-0">
                      <div className="py-2 px-4">
                        <table className="w-full text-xs border-collapse">
                          <tbody>
                            {result.columns.map((column, colIndex) => (
                              <tr key={colIndex} className="border-b border-border last:border-b-0">
                                <td className="py-1.5 pr-4 text-muted-foreground font-medium w-40 flex-shrink-0">{column}</td>
                                <td className="py-1.5 text-foreground font-mono break-all">{formatValueDetailed(row[column])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "bigint") return value.toString();
  return String(value);
}

function formatValueDetailed(value: unknown): string {
  if (value === null) return "NULL";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "bigint") return value.toString();
  return String(value);
}