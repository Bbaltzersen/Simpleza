"use client";

import React, { useState } from "react";
import styles from "./entityLinkForm.module.css"; // Import the CSS module

// Base entity type
interface BaseEntity {
  id: string;
  name: string;
}

// Entity type that includes quantity
interface QuantityEntity extends BaseEntity {
  quantity: number | undefined;
}

// Generic Props for the EntityLinkForm
interface EntityLinkFormProps<T extends BaseEntity> {
  title: string;
  placeholder: string;
  availableEntities: T[];
  selectedEntities: T[];
  setSelectedEntities: (entities: T[]) => void;
  allowQuantity?: boolean;
}

const EntityLinkForm = <T extends BaseEntity>({
  title,
  placeholder,
  availableEntities,
  selectedEntities,
  setSelectedEntities,
  allowQuantity = false,
}: EntityLinkFormProps<T>) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Type guard: Ensure T supports quantity when allowQuantity is true
  const isQuantityEntity = (entity: T): entity is T & QuantityEntity =>
    allowQuantity && "quantity" in entity;

  // Add Entity to Selection
  const addEntity = () => {
    const trimmedInput = inputValue.trim().toLowerCase();
    if (!trimmedInput) return;

    const entity = availableEntities.find((e) => e.name.toLowerCase() === trimmedInput);

    if (entity && !selectedEntities.some((e) => e.id === entity.id)) {
      const newEntity = allowQuantity
        ? ({ ...entity, quantity } as T & QuantityEntity) // ✅ Ensures `quantity` exists
        : entity;

      setSelectedEntities([...selectedEntities, newEntity as T]);

      setQuantity(1);
      setInputValue(""); // Reset input field
    } else {
      alert("Entity not found or already added.");
    }
  };

  // Remove Entity from Selection
  const removeEntity = (id: string) => {
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
        />
        {allowQuantity && (
          <input
            type="number"
            placeholder="Amount"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className={styles.inputSmall}
          />
        )}
        <button type="button" onClick={addEntity} className={styles.addButton}>
          Add
        </button>
      </div>

      {/* Display Linked Entities */}
      <ul className={styles.list}>
        {selectedEntities.map((entity) => (
          <li key={entity.id} className={styles.listItem}>
            {entity.name} {isQuantityEntity(entity) ? `(${entity.quantity})` : ""}
            <button onClick={() => removeEntity(entity.id)} className={styles.removeButton}>
              X
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EntityLinkForm;
