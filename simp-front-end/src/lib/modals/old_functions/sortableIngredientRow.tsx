// "use client";

// import React from "react";
// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import styles from "./recipeModal.module.css";
// import { Minus, GripVertical } from "lucide-react";
// import IngredientSearch from "./ingredientSearch";
// import { RecipeIngredientCreate } from "@/lib/types/recipe";

// interface SortableIngredientRowProps {
//   ingredient: RecipeIngredientCreate;
//   onChange: (id: string, ingredient_name: string, amount: string, measurement: string) => void;
//   onRemove: (id: string) => void;
// }

// const SortableIngredientRow: React.FC<SortableIngredientRowProps> = ({
//   ingredient,
//   onChange,
//   onRemove,
// }) => {
//   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
//     id: ingredient.id,
//   });
//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       className={`${styles.sortableRow} ${isDragging ? styles.dragging : ""}`}
//     >
//       {/* Drag handle */}
//       <div {...listeners} className={styles.dragHandle} style={{ cursor: "grab", paddingRight: "8px" }}>
//         <GripVertical size={20} />
//       </div>
//       {/* Pass current values from the ingredient to IngredientSearch */}
//       <div style={{ flexGrow: 1 }}>
//         <IngredientSearch
//           initialQuery={ingredient.ingredient_name}
//           initialAmount={ingredient.amount ? ingredient.amount.toString() : ""}
//           initialMeasurement={ingredient.measurement}
//           onChange={(selectedIngredient, amount, measurement) =>
//             onChange(
//               ingredient.id,
//               selectedIngredient ? selectedIngredient.name : "",
//               amount,
//               measurement
//             )
//           }
//         />
//       </div>
//       <a
//         type="button"
//         className={styles.iconButton}
//         onClick={(e) => {
//           e.stopPropagation();
//           onRemove(ingredient.id);
//         }}
//       >
//         <Minus size={20} />
//       </a>
//     </div>
//   );
// };

// export default SortableIngredientRow;
