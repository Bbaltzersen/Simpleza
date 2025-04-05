"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./simpleTable.module.css"; // Ensure CSS Modules are set up

// Define the shape of the data items the table expects
interface TableRowData {
  id: string | number;
  values: any[]; // Array of values for each column
}

// Update TableProps to include the optional isLoading prop
interface TableProps<T extends TableRowData> {
  title: string;
  columns: string[];
  data: T[];
  itemsPerPage?: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRowClick: (item: T) => void;
  selectedRowId?: string | number | null;
  isLoading?: boolean; // <-- Added optional isLoading prop
}

const SimpleTable = <T extends TableRowData>({
  title,
  columns,
  data,
  itemsPerPage = 10, // Default items per page
  totalItems,
  currentPage,
  onPageChange,
  onRowClick,
  selectedRowId,
  isLoading = false, // <-- Destructure isLoading with a default value
}: TableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter data based on search query - only apply if not loading
  // Note: Search typically works better on client-side data *or* requires backend support for searching paginated data
  const filteredData = isLoading ? [] : data.filter((item) =>
    item.values.some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Helper function to render table body content
  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          {/* Show a loading indicator spanning all columns */}
          <td colSpan={columns.length} className={`${styles.td} ${styles.loading}`}>
             Loading... {/* You can replace this with a spinner component */}
          </td>
        </tr>
      );
    }

    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className={`${styles.td} ${styles.noData}`}>
            {searchQuery ? 'No results found for your search.' : 'No data available.'}
          </td>
        </tr>
      );
    }

    return filteredData.map((item, index) => (
      <tr
        key={String(item.id)} // Use item ID as key
        onClick={() => onRowClick(item)}
        // Apply styles conditionally based on selection and index
        className={`
          ${styles.clickableRow}
          ${item.id === selectedRowId ? styles.selectedRow : ""}
          ${item.id !== selectedRowId ? (index % 2 === 0 ? styles.evenRow : styles.oddRow) : ""}
        `}
      >
        {item.values.map((value, idx) => (
          // Render cell data, handle null/undefined gracefully
          <td key={idx} className={styles.td}>{value ?? "-"}</td>
        ))}
      </tr>
    ));
  };


  return (
    <div className={styles.container}>
      <h2>{title}</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search displayed data..." // Clarify search scope
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
        disabled={isLoading} // Disable search while loading
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
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {/* Pagination - Disable while loading */}
      <div className={styles.pagination}>
        <button // Changed to button for better accessibility/semantics
          onClick={(e) => {
            e.preventDefault(); // Still prevent default if needed
            if (!isLoading && currentPage > 1) onPageChange(currentPage - 1);
          }}
          className={`${styles.paginationButton} ${currentPage === 1 || isLoading ? styles.disabled : ""}`}
          disabled={currentPage === 1 || isLoading} // Disable button directly
          aria-label="Previous Page"
        >
          <ArrowLeft size={18} />
        </button>
        <span className={styles.pageInfo}>Page {currentPage} of {totalPages} ({totalItems} items)</span>
        <button // Changed to button
          onClick={(e) => {
            e.preventDefault();
            if (!isLoading && currentPage < totalPages) onPageChange(currentPage + 1);
          }}
          className={`${styles.paginationButton} ${currentPage >= totalPages || isLoading ? styles.disabled : ""}`}
          disabled={currentPage >= totalPages || isLoading} // Disable button directly
          aria-label="Next Page"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SimpleTable;