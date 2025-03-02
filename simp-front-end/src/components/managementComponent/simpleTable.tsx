"use client";

import React, { JSX, useState } from "react";
import styles from "./simpleTable.module.css"; // Import CSS module

interface TableProps<T> {
  title: string;
  columns: string[];
  data: T[];
  renderRow: (item: T) => JSX.Element;
  searchableFields: (keyof T)[];
  itemsPerPage?: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const SimpleTable = <T,>({
  title,
  columns,
  data,
  renderRow,
  searchableFields,
  itemsPerPage = 10,
  totalItems,
  currentPage,
  onPageChange,
}: TableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Search Functionality
  const filteredData = data.filter((item) =>
    searchableFields.some((field) =>
      String(item[field]).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className={styles.container}>
      <h3>{title}</h3>

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
              filteredData.map(renderRow)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={styles.paginationButton}>Previous</button>
        <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={styles.paginationButton}>Next</button>
      </div>
    </div>
  );
};

export default SimpleTable;
