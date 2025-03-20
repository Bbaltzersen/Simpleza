import { memo } from "react";
import styles from "./imageList.module.css"; // Create or adjust this CSS file as needed
import { RecipeImageCreate } from "@/lib/types/recipe";

interface ImageListProps {
  images: RecipeImageCreate[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof RecipeImageCreate,
    value: string
  ) => void;
  onRemove: (index: number) => void;
  lastInputRef: React.RefObject<HTMLInputElement | null>;
}

export const ImageList = memo(({
  images,
  onAdd,
  onChange,
  onRemove,
  lastInputRef,
}: ImageListProps) => {
  return (
    <div className={styles.inputContainer}>
      <label>Images:</label>
      <button type="button" onClick={onAdd}>
        Add Image
      </button>
      {images.map((image, index) => (
        <div key={index} className="image-row" style={{ position: "relative", marginTop: "0.5rem" }}>
          <input
            type="text"
            placeholder="Image URL"
            value={image.image_url}
            onChange={(e) => onChange(index, "image_url", e.target.value)}
            ref={index === images.length - 1 ? lastInputRef : null}
          />
          <button type="button" onClick={() => onRemove(index)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
});
