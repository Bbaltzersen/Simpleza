"use client";
import React, { useState } from "react";
import styles from "./entityLinkForm.module.css";

/**
 * Basic shape for any entity we want to link:
 *   - An ID
 *   - A Name
 */
interface BaseEntity {
  id: string;
  name: string;
}

/**
 * If you need an "extra field" (like an amount), you can store it here.
 * This is optional. The code below will handle it if you pass `extraFieldName`.
 */
interface ExtraFieldEntity extends BaseEntity {
  extraField?: number;
}

interface EntityLinkFormProps<T extends BaseEntity> {
  /**
   * Main title to show above the form (e.g. "Link Nutrition to Ingredient").
   */
  title: string;

  /**
   * Placeholder text for the text input (e.g. "Enter Nutrition Name").
   */
  placeholder: string;

  /**
   * The current list of linked entities (already selected).
   */
  selectedEntities: T[];

  /**
   * A state-setter (or any function) to update the current list of linked entities.
   */
  setSelectedEntities: (entities: T[]) => void;

  /**
   * If 'true,' the form will disable the add/remove controls.
   */
  disabled?: boolean;

  /**
   * Optional extra-field details (e.g. an "amount" or "percentage" field).
   */
  extraFieldName?: string;
  extraFieldMin?: number;
  extraFieldStep?: number;

  /**
   * Called when the user clicks "Add."
   * - Should look up the entity in the backend by 'name' (no creation).
   * - If found, link it to the parent record, then return the entity object. 
   * - If not found or link fails, return null.
   */
  onEntityAdd: (name: string, extraFieldValue?: number) => Promise<T | null>;

  /**
   * Called when the user clicks "X" to remove a linked entity.
   * - Should unlink the entity in the backend if necessary.
   */
  onEntityRemove?: (entity: T) => Promise<void>;
}

const EntityLinkForm = <T extends BaseEntity>({
  title,
  placeholder,
  selectedEntities,
  setSelectedEntities,
  disabled = false,
  extraFieldName,
  extraFieldMin = 1,
  extraFieldStep = 1,
  onEntityAdd,
  onEntityRemove,
}: EntityLinkFormProps<T>) => {
  const [inputValue, setInputValue] = useState("");
  const [extraFieldValue, setExtraFieldValue] = useState<number>(extraFieldMin);

  const addEntity = async () => {
    if (disabled) {
      console.log("Add button is disabled, skipping...");
      return;
    }

    const trimmedInput = inputValue.trim();
    if (!trimmedInput) {
      console.log("Input is empty or whitespace, skipping...");
      return;
    }

    // Defer to the parent to find/link the entity
    const newEntity = await onEntityAdd(
      trimmedInput,
      extraFieldName ? extraFieldValue : undefined
    );

    if (!newEntity) {
      console.log("Entity not found in DB, or link failed.");
      return;
    }

    // Check if it's already selected
    if (selectedEntities.some((e) => e.id === newEntity.id)) {
      console.log("Entity is already selected.");
      return;
    }

    // Add to the local list of selected entities
    setSelectedEntities([...selectedEntities, newEntity]);
    setInputValue("");
    setExtraFieldValue(extraFieldMin);
  };

  const removeEntity = async (id: string) => {
    if (disabled || !onEntityRemove) return;
    const entity = selectedEntities.find((e) => e.id === id);
    if (!entity) return;

    try {
      await onEntityRemove(entity);
    } catch (error) {
      console.error("Failed to remove/unlink entity:", error);
      return;
    }

    // Remove from local state
    setSelectedEntities(selectedEntities.filter((e) => e.id !== id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={styles.input}
          disabled={disabled}
        />

        {extraFieldName && (
          <input
            type="number"
            placeholder={extraFieldName}
            min={extraFieldMin}
            step={extraFieldStep}
            value={extraFieldValue}
            onChange={(e) =>
              setExtraFieldValue(
                Math.max(extraFieldMin, Number(e.target.value) || extraFieldMin)
              )
            }
            className={styles.inputSmall}
            disabled={disabled}
          />
        )}

        <button
          type="button"
          onClick={addEntity}
          className={`${styles.addButton} ${disabled ? styles.disabled : ""}`}
          disabled={disabled}
        >
          Add
        </button>
      </div>

      <ul className={styles.list}>
        {selectedEntities.map((entity) => (
          <li key={entity.id} className={styles.listItem}>
            {entity.name}
            {extraFieldName && (entity as ExtraFieldEntity).extraField
              ? ` (${(entity as ExtraFieldEntity).extraField} ${extraFieldName})`
              : ""}
            <button
              onClick={() => removeEntity(entity.id)}
              className={styles.removeButton}
              disabled={disabled}
            >
              X
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EntityLinkForm;
