"use client";

import React, { useEffect, useState } from "react";
import { Product, ProductCreate } from "@/lib/types/product";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import {
  fetchProducts,
  createProduct,
  fetchProductCompanies,
  linkProductToCompany,
  updateProduct,
} from "@/lib/api/ingredient/product";
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<{ id: string; name: string }[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  const [product, setProduct] = useState<Partial<Product>>({
    english_name: "",
    spanish_name: "",
    amount: 0,
    weight: 0,
    measurement: "",
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { products, total } = await fetchProducts((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
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

    loadProducts();
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.english_name?.trim() || !product.spanish_name?.trim()) return;

    try {
      const newProductData: ProductCreate = {
        retail_id: null,
        src_product_id: null,
        english_name: product.english_name.trim(),
        spanish_name: product.spanish_name.trim(),
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
        setTotalProducts((prev) => prev + 1);

        // ✅ Set new product as the selected row
        setSelectedRowId(newProduct.product_id);
        setCurrentProductId(newProduct.product_id);

        setProduct({
          english_name: newProduct.english_name,
          spanish_name: newProduct.spanish_name,
          amount: newProduct.amount,
          weight: newProduct.weight,
          measurement: newProduct.measurement,
        });
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProductId || !product.english_name?.trim() || !product.spanish_name?.trim()) return;

    try {
        const updatedProduct = await updateProduct(currentProductId, {
          english_name: product.english_name.trim(),
          spanish_name: product.spanish_name.trim(),
          amount: product.amount ?? 1,
          weight: product.weight ?? 0,
          measurement: product.measurement || "",
        });

        if (updatedProduct) {
            setProducts((prev) =>
                prev.map((p) => (p.product_id === currentProductId ? updatedProduct : p))
            );
        }
    } catch (error) {
        console.error("Failed to update product:", error);
    }
};


  const handleRowClick = (product: Product) => {
    setSelectedRowId(product.product_id);
    setCurrentProductId(product.product_id);
    setProduct({
      english_name: product.english_name,
      spanish_name: product.spanish_name,
      amount: product.amount,
      weight: product.weight,
      measurement: product.measurement,
    });
  };

  const clearSelection = () => {
    setSelectedRowId(null);
    setCurrentProductId(null);
    setProduct({
      english_name: "",
      spanish_name: "",
      amount: 0,
      weight: 0,
      measurement: "",
    });
    setSelectedCompanies([]);
};

  return (
    <ManagementContainer
            title="Manage Products"
            actionButton={currentProductId && (
                <a onClick={clearSelection} aria-label="Clear Fields">
                    <Plus size={20} />
                </a>
            )}
        >
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
        onAdd={handleAdd}
        addLabel="Add Product"
        isEditMode={!!currentProductId}
        onEdit={handleEdit} // ✅ Fix: Implement proper edit handler
        editLabel="Update Product" // ✅ Fix: Provide a valid edit label
      />


      <EntityLinkForm
        title="Link Product to Company"
        placeholder="Enter Company Name"
        selectedEntities={selectedCompanies}
        setSelectedEntities={setSelectedCompanies}
        disabled={!currentProductId}
        onEntityAdd={async (companyName) => {
          const matchedCompany = companies.find((c) => c.name.toLowerCase() === companyName.toLowerCase());

          if (matchedCompany) {
            const success = await linkProductToCompany(currentProductId!, matchedCompany.name);
            return success ? { id: matchedCompany.company_id, name: matchedCompany.name } : null;
          }

          return null;
        }}
        onEntityRemove={async (company) => {
          setSelectedCompanies((prev) => prev.filter((c) => c.id !== company.id));
        }}
      />



      <SimpleTable
        title="Product List"
        columns={["English Name", "Spanish Name", "Amount", "Weight", "Measurement"]}
        data={products.map((product) => ({
          id: product.product_id,
          values: [
            product.english_name || "",
            product.spanish_name || "",
            product.amount ?? 0,
            `${product.weight ?? 0} g`,
            product.measurement || "",
          ],
        }))}
        totalItems={totalProducts}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        selectedRowId={selectedRowId}
        onRowClick={(item) => {
          const selectedProduct = products.find((p) => p.product_id === item.id);
          if (selectedProduct) {
            handleRowClick(selectedProduct);
          }
        }}
      />


    </ManagementContainer>
  );
};

export default ProductManagement;
