import { memo } from "react";
import styles from "./imageList.module.css"; // Create or adjust this CSS file as needed
import { RecipeImageCreate } from "@/lib/types/recipe";
import { Minus, Plus } from "lucide-react";

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
      <div className={styles.inputHeader}>
      <label>Images:</label>
      <a type="button" onClick={onAdd} className={styles.addButton}>
            <Plus size={20} />
          </a>
      </div>
      {images.map((image, index) => (
        <div className={styles.imageRow} key={index} style={{ position: "relative", marginTop: "0.5rem" }}>
          <input
            type="text"
            className={styles.imageInput}
            placeholder="Image URL"
            value={image.image_url}
            onChange={(e) => onChange(index, "image_url", e.target.value)}
            ref={index === images.length - 1 ? lastInputRef : null}
          />
          <a onClick={() => onRemove(index)} className={styles.removeButton}>
              <Minus size={20} />
            </a>
        </div>
      ))}
    </div>
  );
});
