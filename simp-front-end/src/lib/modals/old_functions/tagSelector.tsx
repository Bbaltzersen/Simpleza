"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchTags, createTag, Tag } from "@/lib/api/tag/tag"; // Import API functions
import styles from "./tagSelector.module.css"; // Import CSS for dropdown styling
import { Minus } from "lucide-react";

interface TagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchTags().then(setTags);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length >= 3) {
      setSuggestions(tags.filter(tag =>
        tag.name.toLowerCase().includes(value.toLowerCase()) &&
        !selectedTags.includes(tag.tag_id) // Exclude already selected tags
      ));
    } else {
      setSuggestions([]);
    }
  };

  const addTag = async (tagName: string) => {
    const existingTag = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    if (existingTag) {
      onChange([...selectedTags, existingTag.tag_id]);
    } else {
      const newTag = await createTag(tagName);
      if (newTag) {
        setTags([...tags, newTag]);
        onChange([...selectedTags, newTag.tag_id]);
      }
    }
    setInputValue("");
    setSuggestions([]);
  };

  return (
    <div className={styles.tagInputContainer} ref={dropdownRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Type at least 3 letters..."
        className={styles.inputField}
      />
      {suggestions.length > 0 && (
        <div className={styles.dropdown}>
          {suggestions.map(tag => (
            <div
              key={tag.tag_id}
              className={styles.dropdownItem}
              onClick={() => addTag(tag.name)}
            >
              {tag.name}
            </div>
          ))}
        </div>
      )}
      <div className={styles.selectedTags}>
        {selectedTags.map(tagId => (
          <span key={tagId} className={styles.tag}>
            {tags.find(tag => tag.tag_id === tagId)?.name || "Unknown Tag"}
            <button
              className={styles.removeTag}
              onClick={() => onChange(selectedTags.filter(t => t !== tagId))}
            >
               <Minus size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
