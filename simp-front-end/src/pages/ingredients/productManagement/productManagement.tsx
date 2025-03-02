"use client";

import React, { useEffect, useState } from "react";
import { Product, ProductCreate } from "@/lib/types/product";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import { fetchProducts, createProduct, fetchProductCompanies } from "@/lib/api/ingredient/product";

const ITEMS_PER_PAGE = 10;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [product, setProduct] = useState<Partial<Product>>({
    english_name: "",
    spanish_name: "",
    amount: 1,
    weight: 0,
    measurement: "",
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { products, total } = await fetchProducts(currentPage, ITEMS_PER_PAGE);
        if (!products) {
          console.error("No products found");
          return;
        }

        const productsWithCompanies = await Promise.all(
          products.map(async (p) => {
            try {
              const companies = await fetchProductCompanies(p.product_id);
              return { ...p, companies };
            } catch (error) {
              console.error(`Error fetching companies for product ${p.product_id}:`, error);
              return { ...p, companies: [] };
            }
          })
        );

        setProducts(productsWithCompanies);
        setTotalProducts(total);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    loadProducts();
  }, [currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.english_name || !product.spanish_name) return;

    try {
      const newProductData: ProductCreate = {
        retail_id: null,
        src_product_id: null,
        english_name: product.english_name,
        spanish_name: product.spanish_name,
        amount: product.amount || 1,
        weight: product.weight || 0,
        measurement: product.measurement || "",
        company_prices: selectedCompanies.reduce((acc, company) => {
          acc[company.name] = 0;
          return acc;
        }, {} as Record<string, number>),
      };

      const newProduct = await createProduct(newProductData);
      if (newProduct) {
        setProducts((prev) => [...prev, { ...newProduct, companies: [] }]);
        setProduct({
          english_name: "",
          spanish_name: "",
          amount: 1,
          weight: 0,
          measurement: "",
        });
        setSelectedCompanies([]);
        setTotalProducts((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  return (
    <ManagementContainer title="Manage Products">
      <SimpleForm
        fields={[
          { name: "english_name", type: "text", placeholder: "English Name", required: true },
          { name: "spanish_name", type: "text", placeholder: "Spanish Name", required: true },
          { name: "amount", type: "number", placeholder: "Amount" },
          { name: "weight", type: "number", placeholder: "Weight" },
          { name: "measurement", type: "text", placeholder: "Measurement Unit" },
        ]}
        state={product}
        setState={setProduct}
        onSubmit={handleSubmit}
        submitLabel="Add Product"
      />

      <EntityLinkForm
        title="Link Product to Company"
        placeholder="Insert Company Name"
        availableEntities={products.flatMap((p) => p.companies || []).map((c) => ({
          id: c.company_name,
          name: c.company_name,
        }))}
        selectedEntities={selectedCompanies.map((c) => ({
          id: c.company_id,
          name: c.name,
        }))}
        setSelectedEntities={(updatedCompanies) =>
          setSelectedCompanies(updatedCompanies.map((c) => ({ company_id: c.id, name: c.name })))
        }
      />

      <SimpleTable
        title="Product List"
        columns={["English Name", "Spanish Name", "Amount", "Weight", "Measurement", "Companies"]}
        data={products}
        totalItems={totalProducts}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        searchableFields={["english_name", "spanish_name"]}
        renderRow={(product) => (
          <tr key={product.product_id}>
            <td>{product.english_name}</td>
            <td>{product.spanish_name}</td>
            <td>{product.amount}</td>
            <td>{product.weight} g</td>
            <td>{product.measurement}</td>
            <td>
              <ul>
                {product.companies?.map((company) => (
                  <li key={company.company_name}>{company.company_name} - ${company.price}</li>
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
