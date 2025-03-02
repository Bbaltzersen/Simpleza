"use client";

import React, { useState } from "react";
import { Product } from "@/lib/types/product";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";

// Mock Companies (Replace with API call later)
const mockCompanies: Company[] = [
  { company_id: "1", name: "Nestle" },
  { company_id: "2", name: "PepsiCo" },
  { company_id: "3", name: "Unilever" },
];

interface FormField {
  name: keyof Product;
  type: "text" | "number";
  placeholder: string;
  required?: boolean;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [product, setProduct] = useState<Partial<Product>>({
    retail_id: undefined,
    src_product_id: undefined,
    english_name: "",
    spanish_name: "",
    amount: 1,
    weight: 0,
    measurement: "",
  });

  // Form Fields
  const productFields: FormField[] = [
    { name: "retail_id", type: "number", placeholder: "Retail ID (Optional)" },
    { name: "src_product_id", type: "text", placeholder: "Source Product ID (Optional)" },
    { name: "english_name", type: "text", placeholder: "English Name", required: true },
    { name: "spanish_name", type: "text", placeholder: "Spanish Name", required: true },
    { name: "amount", type: "number", placeholder: "Amount" },
    { name: "weight", type: "number", placeholder: "Weight" },
    { name: "measurement", type: "text", placeholder: "Measurement Unit" },
  ];

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
    setSelectedCompanies([]); // Reset linked companies
  };

  return (
    <ManagementContainer title="Manage Products">
      <SimpleForm
        title="Add Product"
        fields={productFields}
        state={product}
        setState={setProduct}
        onSubmit={handleSubmit}
        submitLabel="Add Product"
      />

      <EntityLinkForm
        title="Link Product to Company"
        placeholder="Enter Company Name"
        availableEntities={mockCompanies.map((c) => ({
          id: c.company_id,
          name: c.name,
        }))}
        selectedEntities={selectedCompanies.map((c) => ({
          id: c.company_id,
          name: c.name,
        }))}
        setSelectedEntities={(updatedCompanies) =>
          setSelectedCompanies(
            updatedCompanies.map((c) => ({
              company_id: c.id,
              name: c.name,
            }))
          )
        }
      />

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
                {selectedCompanies.map((company) => (
                  <li key={company.company_id}>{company.name}</li>
                ))}
              </ul>
            </td>
          </tr>
        )}
      />
    </ManagementContainer>
  );
};

export default ProductManagement;