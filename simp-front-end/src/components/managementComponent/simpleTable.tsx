"use client";

import React, { JSX, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react"; // ✅ Import Lucide icons
import styles from "./simpleTable.module.css";

interface TableProps<T extends { id: string | number }> {
  title: string;
  columns: string[];
  data: T[];
  renderRow: (item: T, onClick: () => void) => JSX.Element;
  searchableFields: (keyof T)[];
  itemsPerPage?: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRowClick: (item: T) => void;
}

const SimpleTable = <T extends { id: string | number }>({
  title,
  columns,
  data,
  renderRow,
  searchableFields,
  itemsPerPage = 10,
  totalItems,
  currentPage,
  onPageChange,
  onRowClick,
}: TableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredData = data.filter((item) =>
    searchableFields.some((field) =>
      String(item[field]).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
              filteredData.map((item) => {
                const rowContent = renderRow(item, () => onRowClick(item));
                return (
                  <tr
                    key={String(item.id)}
                    onClick={() => onRowClick(item)}
                    className={styles.clickableRow}
                  >
                    {React.Children.toArray(rowContent)}
                  </tr>
                );
              })
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
