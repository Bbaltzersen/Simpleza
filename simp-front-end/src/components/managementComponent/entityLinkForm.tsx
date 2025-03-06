"use client";
import React, { useState } from "react";
import styles from "./entityLinkForm.module.css";

interface BaseEntity {
  id: string;
  name: string;
}

interface ExtraFieldEntity extends BaseEntity {
  extraField?: number;
}

interface EntityLinkFormProps<T extends BaseEntity> {
  title: string;
  placeholder: string;
  selectedEntities: T[];
  setSelectedEntities: (entities: T[]) => void;
  disabled?: boolean;
  extraFieldName?: string;
  extraFieldMin?: number;
  extraFieldStep?: number;
  onEntityAdd: (name: string, extraFieldValue?: number) => Promise<T | null>;
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
    if (disabled) return;

    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    const newEntity = await onEntityAdd(
      trimmedInput,
      extraFieldName ? extraFieldValue : undefined
    );

    if (!newEntity || selectedEntities.some((e) => e.id === newEntity.id)) return;

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

    setSelectedEntities(selectedEntities.filter((e) => e.id !== id));
  };

  if (disabled) return null;

  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>

      {/* Input Fields */}
      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={styles.input}
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
          />
        )}

        <button type="button" onClick={addEntity} className={styles.addButton}>
          Add
        </button>
      </div>

      {/* Improved Row List */}
      <ul className={styles.list}>
        {selectedEntities.length === 0 ? (
          <li className={styles.noData}>No entities added.</li>
        ) : (
          selectedEntities.map((entity) => (
            <li key={entity.id} className={styles.listItem}>
              <span className={styles.entityName}>{entity.name}</span>
              {extraFieldName && (entity as ExtraFieldEntity).extraField && (
                <span className={styles.extraField}>
                  ({(entity as ExtraFieldEntity).extraField} {extraFieldName})
                </span>
              )}
              <button onClick={() => removeEntity(entity.id)} className={styles.removeButton}>
                ✖
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default EntityLinkForm;
