// components/managementComponent/AutosizeTextarea.tsx

"use client";

import React, { useRef, useEffect, useLayoutEffect, TextareaHTMLAttributes } from 'react';

// Define props, extending standard Textarea attributes
// We'll explicitly handle 'value' and 'onChange' but accept others via spread
interface AutosizeTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string | number | readonly string[] | undefined;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // Optional: minRows for initial minimum height calculation
  minRows?: number;
}

const AutosizeTextarea: React.FC<AutosizeTextareaProps> = ({
  value,
  onChange,
  minRows = 1, // Default minimum rows
  ...props // Spread other standard textarea props (placeholder, id, name, required, disabled, etc.)
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to resize based on content
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height temporarily to calculate the scroll height accurately
      textarea.style.height = 'auto';
      // Calculate the height based on scroll height
      let newHeight = textarea.scrollHeight;

      // Optional: Calculate height based on minRows if content is short
      // This requires knowing the computed line-height and padding/border
      if (minRows > 0) {
         try {
             const computedStyle = window.getComputedStyle(textarea);
             const lineHeight = parseFloat(computedStyle.lineHeight);
             // Get vertical padding and border
             const paddingTop = parseFloat(computedStyle.paddingTop);
             const paddingBottom = parseFloat(computedStyle.paddingBottom);
             const borderTop = parseFloat(computedStyle.borderTopWidth);
             const borderBottom = parseFloat(computedStyle.borderBottomWidth);
             const paddingBorder = paddingTop + paddingBottom + borderTop + borderBottom;

             // Calculate minimum height based on rows and line height
             const minHeight = (minRows * lineHeight) + paddingBorder;

             // Use the larger of scrollHeight or calculated minHeight
             newHeight = Math.max(newHeight, minHeight);
         } catch (e) {
            console.error("Could not compute style for minRows calculation", e);
            // Fallback to just scrollHeight if style computation fails
         }
      }


      textarea.style.height = `${newHeight}px`;
      // Hide scrollbar unless content exceeds max-height (set via CSS if needed)
      textarea.style.overflowY = 'hidden';
    }
  };

  // useLayoutEffect runs synchronously after DOM mutations but before paint
  // Good for measurements that need to happen before the browser paints
  // Use this for initial sizing and resizing when the value prop changes
  useLayoutEffect(() => {
    autoResize();
  }, [value]); // Rerun whenever the value prop changes externally

  // Handle internal onChange to trigger resize immediately after typing
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Call the passed-in onChange from the parent first to update state
      if (onChange) {
          onChange(event);
      }
      // Then resize based on the new content in the DOM (will run layout effect too, but this can feel smoother)
      // autoResize(); // LayoutEffect is usually sufficient
  };


  return (
    <textarea
      ref={textareaRef}
      value={value ?? ""} // Ensure value is controlled
      onChange={handleChange}
      rows={minRows} // Set initial rows based on minRows prop
      {...props} // Spread the rest of the props (id, name, placeholder, className, required, disabled)
    />
  );
};

export default AutosizeTextarea;