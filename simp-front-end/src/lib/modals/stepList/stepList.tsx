import { memo } from "react";
import styles from "./stepList.module.css"; // Create/adjust this CSS file as needed
import { RecipeStepCreate } from "@/lib/types/recipe";
import { Minus, Plus } from "lucide-react";

interface StepListProps {
  steps: RecipeStepCreate[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof RecipeStepCreate,
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
  lastInputRef: React.RefObject<HTMLTextAreaElement | null>; // Updated type
}

export const StepList = memo(({
  steps,
  onAdd,
  onChange,
  onRemove,
  lastInputRef,
}: StepListProps) => {
  return (
    <div className={styles.inputContainer}>
      <div className={styles.inputHeader}>
      <label>Steps:</label>
      <a type="button" onClick={onAdd} className={styles.addButton}>
            <Plus size={20} />
          </a>
      </div>
      {steps.map((step, index) => (
        <div key={index} className={styles.stepRow} style={{ position: "relative", marginTop: "0.5rem" }}>
          <div className={styles.stepPosition}>
            <span>Step {index + 1}</span>
          </div>
          <textarea
            placeholder="Step description"
            value={step.description}
            onChange={(e) => onChange(index, "description", e.target.value)}
            ref={index === steps.length - 1 ? lastInputRef : null}
          />
          <a onClick={() => onRemove(index)} className={styles.removeButton}>
              <Minus size={20} />
            </a>
        </div>
      ))}
    </div>
  );
});
