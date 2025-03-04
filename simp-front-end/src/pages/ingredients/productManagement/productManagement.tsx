"use client";

import React, { useEffect, useRef, useState } from "react";
import { Product, ProductCreate } from "@/lib/types/product";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import { fetchProducts, createProduct, fetchProductCompanies, linkProductToCompany } from "@/lib/api/ingredient/product";

const ITEMS_PER_PAGE = 10;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<{ id: string; name: string }[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  const [product, setProduct] = useState<Partial<Product>>({
    english_name: "",
    spanish_name: "",
    amount: 1,
    weight: 0,
    measurement: "",
  });

  const fetchedOnce = useRef(false);

useEffect(() => {
  const loadProducts = async () => {
    try {
      const { products, total } = await fetchProducts(currentPage, ITEMS_PER_PAGE);
      if (!products) {
        console.error("No products found");
        return;
      }
      setProducts(products);
      setTotalProducts(total);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  if (!fetchedOnce.current) {
    loadProducts();
    fetchedOnce.current = true;
  }
}, [currentPage]);

  useEffect(() => {
    if (!currentProductId) return;
    
    const loadProductCompanies = async () => {
      try {
        const linkedCompanies = await fetchProductCompanies(currentProductId);
        setSelectedCompanies(
          linkedCompanies.map((c) => ({
            id: c.company_id,
            name: c.company_name,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch linked companies:", error);
        setSelectedCompanies([]);
      }
    };

    loadProductCompanies();
  }, [currentProductId]);

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
        setCurrentProductId(newProduct.product_id);
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const handleRowClick = async (product: Product) => {
    setCurrentProductId(product.product_id);
    setProduct({
      english_name: product.english_name,
      spanish_name: product.spanish_name,
      amount: product.amount,
      weight: product.weight,
      measurement: product.measurement,
    });
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
        availableEntities={companies.map((c) => ({ id: c.company_id, name: c.name }))}
        selectedEntities={selectedCompanies}
        setSelectedEntities={(updatedEntities) => {
          const newCompany = updatedEntities.find((n) => !selectedCompanies.some((sn) => sn.id === n.id));

          if (newCompany) {
              if (currentProductId) {
                linkProductToCompany(currentProductId, newCompany.name).then((success) => {
                    if (success) {
                        setSelectedCompanies([...selectedCompanies, newCompany]); // ✅ Ensure state updates correctly
                    }
                });
              }
          }
      }}
        disabled={!currentProductId}
      />

      <SimpleTable
        title="Product List"
        columns={["English Name", "Spanish Name", "Amount", "Weight", "Measurement", "Companies"]}
        data={products.map((product) => ({
          ...product,
          id: product.product_id,
        }))}
        totalItems={totalProducts}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        searchableFields={["english_name", "spanish_name"]}
        onRowClick={handleRowClick}
        renderRow={(product, onClick) => (
          <>
            <td>{product.english_name}</td>
            <td>{product.spanish_name}</td>
            <td>{product.amount}</td>
            <td>{product.weight} g</td>
            <td>{product.measurement}</td>
          </>
        )}
      />
    </ManagementContainer>
  );
};

export default ProductManagement;
