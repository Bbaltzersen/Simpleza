import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import { fetchTagsByName } from "@/lib/api/recipe/recipe";
import { RecipeTagCreate } from "@/lib/types/recipe";
import styles from "./tagList.module.css";

export const TagList = memo(
  ({
    tags,
    onAdd,
    onChange,
    onRemove,
    lastInputRef,
  }: {
    tags: (RecipeTagCreate & { tag_error?: string })[];
    onAdd: () => void;
    onChange: (
      index: number,
      field: keyof RecipeTagCreate,
      value: string | number
    ) => void;
    onRemove: (index: number) => void;
    lastInputRef: React.RefObject<HTMLInputElement | null>;
  }) => {
    // Local state for tag search results.
    const [searchResults, setSearchResults] = useState<RecipeTagCreate[]>([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Fetch tag search results locally.
    const fetchTagSearchResults = useCallback(async (query: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await fetchTagsByName(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Tag search failed:", error);
        setSearchResults([]);
      }
    }, []);

    // Close dropdown when clicking outside.
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          !dropdownRefs.current.some(
            (ref) => ref && ref.contains(event.target as Node)
          )
        ) {
          setActiveDropdownIndex(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (query: string, index: number) => {
      if (query.length > 2) {
        fetchTagSearchResults(query);
        setActiveDropdownIndex(index);
      } else {
        setActiveDropdownIndex(null);
      }
    };

    const handleSelect = (index: number, selectedTag: string) => {
      onChange(index, "name", selectedTag);
      setActiveDropdownIndex(null);
      setSelectedIndices((prev) => new Set(prev).add(index));
    };

    // Filter search results to exclude tags already in the list (case-insensitive).
    const filteredResults = searchResults.filter((result) =>
      !tags.some(
        (tag) =>
          tag.name.trim().toLowerCase() === result.name.trim().toLowerCase()
      )
    );

    return (
      <div className={styles.inputContainer}>
        <label>Tags:</label>
        <button type="button" onClick={onAdd}>
          Add Tag
        </button>

        {tags.map((tag, index) => (
          <div key={index} className="tag-row" style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Tag Name"
              value={tag.name}
              onChange={(e) => {
                onChange(index, "name", e.target.value);
                if (selectedIndices.has(index)) {
                  setSelectedIndices((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                  });
                }
                handleSearch(e.target.value, index);
              }}
              onFocus={() => {
                if (!selectedIndices.has(index) && tag.name.length > 2) {
                  handleSearch(tag.name, index);
                }
              }}
              onBlur={() => setTimeout(() => setActiveDropdownIndex(null), 150)}
              ref={lastInputRef}
              style={tag.tag_error ? { backgroundColor: "#ffe6e6" } : {}}
            />

            {activeDropdownIndex === index &&
              tag.name.length > 2 &&
              filteredResults.length > 0 && (
                <div
                  ref={(el) => {
                    dropdownRefs.current[index] = el;
                  }}
                  className={styles.dropdown}
                >
                  {filteredResults.map((result, i) => (
                    <div
                      key={i}
                      className={styles.dropdownItem}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(index, result.name)}
                    >
                      {result.name}
                    </div>
                  ))}
                </div>
              )}

            <button type="button" onClick={() => onRemove(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  }
);
