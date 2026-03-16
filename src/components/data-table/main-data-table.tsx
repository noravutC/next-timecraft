"use client";
import React from "react";

export interface ColumnDataTable<TData> {
  key: string;
  label: string;
  render: (data: TData) => React.ReactNode;
  isVisible: boolean;
  isSortable: boolean;
}

export interface MainDataTableProps<TData> {
  data: TData[];
  columns: ColumnDataTable<TData>[];
}
// Don't used yet
export function MainDataTanle<TData>({
  data,
  columns,
}: MainDataTableProps<TData>) {
  return (
    <div className="max-w-full p-4 text-[var(--text-color-column-table)]">
      <div className="max-h-[30vh] overflow-x-auto overflow-y-auto border rounded relative">
        <div className="min-w-max">
          {/* Sticky Header */}
          <div className="flex justify-between bg-gray-100 sticky top-0 z-10 border-b">
            {columns
              .filter((col) => col.isVisible)
              .map((col) => (
                <div
                  key={col.key}
                  className="min-w-[10vw] text-xs font-bold p-2 bg-gray-100"
                >
                  {col.label}
                </div>
              ))}
          </div>

          {/* Data Rows */}
          {data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-between border-b items-center"
            >
              {columns
                .filter((col) => col.isVisible)
                .map((col) => (
                  <div key={col.key} className="min-w-[10vw] text-sm p-2">
                    {col.render(row)}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
