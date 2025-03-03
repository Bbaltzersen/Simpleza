"use client";

import React, { useState } from "react";
import styles from "./entityLinkForm.module.css";

interface BaseEntity {
  id: string;
  name: string;
}

interface QuantityEntity extends BaseEntity {
  quantity: number;
}

interface EntityLinkFormProps<T extends BaseEntity> {
  title: string;
  placeholder: string;
  availableEntities: T[];
  selectedEntities: T[];
  setSelectedEntities: (entities: T[]) => void;
  allowQuantity?: boolean;
  disabled?: boolean;
}

const EntityLinkForm = <T extends BaseEntity>({
  title,
  placeholder,
  availableEntities,
  selectedEntities,
  setSelectedEntities,
  allowQuantity = false,
  disabled = false, // Default: enabled
}: EntityLinkFormProps<T>) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const isQuantityEntity = (entity: BaseEntity): entity is QuantityEntity =>
    allowQuantity && (entity as QuantityEntity).quantity !== undefined;

  const addEntity = () => {
    if (disabled) return; 

    const trimmedInput = inputValue.trim().toLowerCase();
    if (!trimmedInput) return;

    const entity = availableEntities.find((e) => e.name.toLowerCase() === trimmedInput);

    if (entity && !selectedEntities.some((e) => e.id === entity.id)) {
      const newEntity = allowQuantity
        ? ({ ...entity, quantity } as QuantityEntity)
        : entity;

      setSelectedEntities([...selectedEntities, newEntity as T]);
      setInputValue("");
      setQuantity(1);
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
        {allowQuantity && (
          <input
            type="number"
            placeholder="Amount"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className={styles.inputSmall}
            disabled={disabled} 
          />
        )}
        <button
          type="button"
          onClick={addEntity}
          className={`${styles.addButton} ${disabled ? styles.disabled : ""}`} // ✅ Apply disabled styles
          disabled={disabled} 
        >
          Add
        </button>
      </div>

      <ul className={styles.list}>
        {selectedEntities.map((entity) => (
          <li key={entity.id} className={styles.listItem}>
            {entity.name} {isQuantityEntity(entity) ? `(${(entity as QuantityEntity).quantity})` : ""}
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
