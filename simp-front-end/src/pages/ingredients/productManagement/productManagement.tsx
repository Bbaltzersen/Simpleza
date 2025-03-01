"use client";

import React from "react";
import { Product } from "@/lib/types/product";

const ProductManagement: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Products</h2>

      {/* Add Product Form */}
      <div className="mb-4">
        <p>[Form for adding products]</p>
      </div>

      {/* List of Products */}
      <ul className="border p-4">
        <p>[List of existing products]</p>
      </ul>
    </div>
  );
};

export default ProductManagement;
