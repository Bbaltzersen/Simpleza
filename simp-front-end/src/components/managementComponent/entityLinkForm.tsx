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
  availableEntities: T[];
  selectedEntities: T[];
  setSelectedEntities: (entities: T[]) => void;
  extraFieldName?: string;
  extraFieldMin?: number;
  extraFieldStep?: number;
  disabled?: boolean;
}

const EntityLinkForm = <T extends BaseEntity>({
  title,
  placeholder,
  availableEntities,
  selectedEntities,
  setSelectedEntities,
  extraFieldName,
  extraFieldMin = 1,
  extraFieldStep = 1,
  disabled = false,
}: EntityLinkFormProps<T>) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [extraFieldValue, setExtraFieldValue] = useState<number>(extraFieldMin);

  const isExtraFieldEntity = (entity: BaseEntity): entity is ExtraFieldEntity =>
    extraFieldName !== undefined && (entity as ExtraFieldEntity).extraField !== undefined;

const addEntity = () => {
  if (disabled) {
    console.log("Add button is disabled, skipping...");
    return;
  }

  console.log("Add button clicked!");
  const trimmedInput = inputValue.trim().toLowerCase();
  if (!trimmedInput) {
    console.log("Input is empty or whitespace, skipping...");
    return;
  }

  const entity = availableEntities.find((e) => e.name.toLowerCase() === trimmedInput);

  if (entity && !selectedEntities.some((e) => e.id === entity.id)) {
    const newEntity = extraFieldName ? ({ ...entity, extraField: extraFieldValue } as ExtraFieldEntity) : entity;
    console.log("Adding entity:", newEntity);
    setSelectedEntities([...selectedEntities, newEntity as T]);
    setInputValue("");
    setExtraFieldValue(extraFieldMin);
  } else {
    console.log("Entity already selected or not found.");
  }
};


  const removeEntity = (id: string) => {
    if (disabled) return;
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
            onChange={(e) => setExtraFieldValue(Math.max(extraFieldMin, Number(e.target.value) || extraFieldMin))}
            className={styles.inputSmall}
            disabled={disabled}
          />
        )}
        <button
          type="button"
          onClick={addEntity}
          className={`${styles.addButton} ${disabled ? styles.disabled : ""}`}
          disabled={false}
        >
          Add
        </button>
      </div>
      <ul className={styles.list}>
        {selectedEntities.map((entity) => (
          <li key={entity.id} className={styles.listItem}>
            {entity.name} {isExtraFieldEntity(entity) ? `(${(entity as ExtraFieldEntity).extraField} ${extraFieldName})` : ""}
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