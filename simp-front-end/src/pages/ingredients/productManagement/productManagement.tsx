"use client";

import React, { useEffect, useState, useRef } from "react";
import { Product, ProductCreate } from "@/lib/types/product";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import { fetchProducts, createProduct } from "@/lib/api/ingredient/product";
import { fetchCompanies } from "@/lib/api/ingredient/company";

const ITEMS_PER_PAGE = 10;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [product, setProduct] = useState<Partial<Product>>({
    retail_id: undefined,
    src_product_id: undefined,
    english_name: "",
    spanish_name: "",
    amount: undefined,
    weight: undefined,
    measurement: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Prevent multiple fetches & track initial render
  const isProductsFetched = useRef(false);
  const isCompaniesFetched = useRef(false);
  const isFirstRender = useRef(true);

  // Fetch products when page changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false; // ✅ Prevent unnecessary fetch on first render
      return;
    }

    if (isProductsFetched.current) return; // ✅ Prevent duplicate fetch
    isProductsFetched.current = true;

    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        const { products, total } = await fetchProducts(currentPage, ITEMS_PER_PAGE);
        setProducts(products);
        setTotalProducts(total);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") console.error("Error fetching products:", error);
      }
    };

    loadProducts();

    return () => {
      controller.abort();
      isProductsFetched.current = false; // ✅ Reset flag when unmounting
    };
  }, [currentPage]);

  // Fetch companies only once
  useEffect(() => {
    if (isCompaniesFetched.current) return; // ✅ Prevent duplicate fetch
    isCompaniesFetched.current = true;

    const controller = new AbortController();

    const loadCompanies = async () => {
      try {
        const fetchedCompanies = await fetchCompanies();
        setCompanies(fetchedCompanies);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") console.error("Error fetching companies:", error);
      }
    };

    loadCompanies();

    return () => {
      controller.abort();
    };
  }, []);

  // Handle Pagination
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Handle Product Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.english_name || !product.spanish_name) return;

    try {
      const newProductData: ProductCreate = {
        retail_id: product.retail_id || null,
        src_product_id: product.src_product_id || null,
        english_name: product.english_name,
        spanish_name: product.spanish_name,
        amount: product.amount || 1,
        weight: product.weight || 0,
        measurement: product.measurement || "",
        company_prices: selectedCompanies.reduce((acc, company) => {
          acc[company.name] = 0; // Default price, can be modified
          return acc;
        }, {} as Record<string, number>),
      };

      const newProduct = await createProduct(newProductData);
      if (newProduct) {
        setProducts((prev) => [...prev, newProduct]);
        setProduct({
          retail_id: undefined,
          src_product_id: undefined,
          english_name: "",
          spanish_name: "",
          amount: 1,
          weight: 0,
          measurement: "",
        });
        setSelectedCompanies([]);
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  return (
    <ManagementContainer title="Manage Products">
      {/* Product Form */}
      <SimpleForm
        fields={[
          { name: "retail_id", type: "number", placeholder: "Retail ID (Optional)" },
          { name: "src_product_id", type: "text", placeholder: "Source Product ID (Optional)" },
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

      {/* Company Linking */}
      <EntityLinkForm
        title="Link Product to Company"
        placeholder="Enter Company Name"
        availableEntities={companies.map((c) => ({
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

      {/* Product Table */}
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
                {product.companies?.map((company) => (
                  <li key={company.company_name}>{company.company_name} - ${company.price}</li>
                ))}
              </ul>
            </td>
          </tr>
        )}
      />

      {/* Pagination Controls */}
      <div className="flex justify-between mt-4">
        <button onClick={goToPrevPage} disabled={currentPage === 1} className="px-4 py-2 border rounded">
          Previous
        </button>
        <span className="text-lg">
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} className="px-4 py-2 border rounded">
          Next
        </button>
      </div>
    </ManagementContainer>
  );
};

export default ProductManagement;
