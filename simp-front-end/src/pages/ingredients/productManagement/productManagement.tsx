"use client";

import React, { useState } from "react";
import { Product } from "@/lib/types/product";

const ProductManagement: React.FC = () => {
  const [product, setProduct] = useState<Partial<Product>>({
    english_name: "",
    spanish_name: "",
    amount: 1,
    weight: 0,
    measurement: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New Product:", product);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Products</h2>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="English Name"
          value={product.english_name || ""}
          onChange={(e) => setProduct({ ...product, english_name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="Spanish Name"
          value={product.spanish_name || ""}
          onChange={(e) => setProduct({ ...product, spanish_name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={product.amount || ""}
          onChange={(e) => setProduct({ ...product, amount: Number(e.target.value) })}
          className="border p-2 w-full"
        />
        <input
          type="number"
          placeholder="Weight"
          value={product.weight || ""}
          onChange={(e) => setProduct({ ...product, weight: Number(e.target.value) })}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Measurement Unit"
          value={product.measurement || ""}
          onChange={(e) => setProduct({ ...product, measurement: e.target.value })}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          Add Product
        </button>
      </form>
    </div>
  );
};

export default ProductManagement;
