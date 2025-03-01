"use client";

import React, { useState } from "react";
import { Product } from "@/lib/types/product";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";

// Mock Companies (Replace with API call later)
const mockCompanies: Company[] = [
  { company_id: "1", name: "Nestle" },
  { company_id: "2", name: "PepsiCo" },
  { company_id: "3", name: "Unilever" },
];

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productCompanies, setProductCompanies] = useState<{ product_id: string; company: Company }[]>([]);
  const [product, setProduct] = useState<Partial<Product>>({
    retail_id: undefined,
    src_product_id: undefined,
    english_name: "",
    spanish_name: "",
    amount: 1,
    weight: 0,
    measurement: "",
  });

  const [companyInput, setCompanyInput] = useState<string>("");

  // Handle Product Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      product_id: crypto.randomUUID(),
      retail_id: product.retail_id || null,
      src_product_id: product.src_product_id || null,
      english_name: product.english_name || "",
      spanish_name: product.spanish_name || "",
      amount: product.amount || 1,
      weight: product.weight || 0,
      measurement: product.measurement || "",
    };
    setProducts([...products, newProduct]); // Add product to list
    setProduct({
      retail_id: undefined,
      src_product_id: undefined,
      english_name: "",
      spanish_name: "",
      amount: 1,
      weight: 0,
      measurement: "",
    }); // Reset input fields
    setCompanyInput(""); // Reset linked companies
  };

  // Add Company to Product
  const addCompanyToProduct = (productId: string) => {
    const trimmedInput = companyInput.trim().toLowerCase();
    if (!trimmedInput) return;

    const company = mockCompanies.find((c) => c.name.toLowerCase() === trimmedInput);
    if (company && !productCompanies.some((pc) => pc.product_id === productId && pc.company.company_id === company.company_id)) {
      setProductCompanies([...productCompanies, { product_id: productId, company }]);
      setCompanyInput(""); // Reset input field
    } else {
      alert("Company not found or already linked.");
    }
  };

  // Remove Company from Product
  const removeCompanyFromProduct = (productId: string, companyId: string) => {
    setProductCompanies(productCompanies.filter((pc) => !(pc.product_id === productId && pc.company.company_id === companyId)));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Products</h2>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="number"
          placeholder="Retail ID (Optional)"
          value={product.retail_id || ""}
          onChange={(e) => setProduct({ ...product, retail_id: Number(e.target.value) })}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Source Product ID (Optional)"
          value={product.src_product_id || ""}
          onChange={(e) => setProduct({ ...product, src_product_id: e.target.value })}
          className="border p-2 w-full"
        />
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

        {/* Company Input Field */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Link Product to Company</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter Company Name"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              className="border p-2 flex-1"
            />
            <button type="button" onClick={() => addCompanyToProduct(product.product_id!)} className="bg-green-500 text-white p-2">
              Add
            </button>
          </div>

          {/* Display Added Companies */}
          <ul className="mt-2">
            {productCompanies.map((pc) => (
              <li key={pc.company.company_id} className="flex justify-between p-1 border-b">
                {pc.company.name}
                <button onClick={() => removeCompanyFromProduct(pc.product_id, pc.company.company_id)} className="text-red-500">X</button>
              </li>
            ))}
          </ul>
        </div>

        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          Add Product
        </button>
      </form>

      <SimpleTable
        title="Product List"
        columns={["English Name", "Spanish Name", "Amount", "Weight", "Measurement", "Companies"]}
        data={products}
        searchableFields={["english_name", "spanish_name"]}
        renderRow={(product) => (
          <tr key={product.product_id} className="border-b">
            <td className="border p-2">{product.english_name}</td>
            <td className="border p-2">{product.spanish_name}</td>
            <td className="border p-2">{product.amount}</td>
            <td className="border p-2">{product.weight} g</td>
            <td className="border p-2">{product.measurement}</td>
            <td className="border p-2">
              <ul>
                {productCompanies
                  .filter((pc) => pc.product_id === product.product_id)
                  .map((pc) => (
                    <li key={pc.company.company_id} className="flex justify-between">
                      {pc.company.name}
                      <button onClick={() => removeCompanyFromProduct(product.product_id!, pc.company.company_id)} className="text-red-500">X</button>
                    </li>
                  ))}
              </ul>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default ProductManagement;
