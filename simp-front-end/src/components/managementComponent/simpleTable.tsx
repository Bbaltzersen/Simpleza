"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./simpleTable.module.css";

interface TableProps<T extends { id: string | number; values: any[] }> {
  title: string;
  columns: string[];
  data: T[];
  itemsPerPage?: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRowClick: (item: T) => void;
  selectedRowId?: string | number | null; // ✅ Use selectedRowId for highlighting
}

const SimpleTable = <T extends { id: string | number; values: any[] }>({
  title,
  columns,
  data,
  itemsPerPage = 10,
  totalItems,
  currentPage,
  onPageChange,
  onRowClick,
  selectedRowId, // ✅ Use selectedRowId for highlighting
}: TableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter data based on search query
  const filteredData = data.filter((item) =>
    item.values.some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className={styles.container}>
      <h2>{title}</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
      />

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} className={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.noData}>No data found.</td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr
                  key={String(item.id)}
                  onClick={() => onRowClick(item)}
                  className={`${styles.clickableRow} 
                  ${item.id === selectedRowId ? styles.selectedRow : ""}
                  ${item.id !== selectedRowId ? (index % 2 === 0 ? styles.evenRow : styles.oddRow) : ""}
                  `}
                >
                  {item.values.map((value, idx) => (
                    <td key={idx} className={styles.td}>{value}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <a
          onClick={(e) => {
            e.preventDefault();
            if (currentPage > 1) onPageChange(currentPage - 1);
          }}
          className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ""}`}
          href="#"
        >
          <ArrowLeft size={18} />
        </a>
        <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
        <a
          onClick={(e) => {
            e.preventDefault();
            if (currentPage < totalPages) onPageChange(currentPage + 1);
          }}
          className={`${styles.paginationButton} ${currentPage >= totalPages ? styles.disabled : ""}`}
          href="#"
        >
          <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
};

export default SimpleTable;
