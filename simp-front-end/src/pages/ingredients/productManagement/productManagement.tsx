"use client";

import React, { useEffect, useState, useCallback } from "react";
// --- Types ---
import {
    Product,
    ProductCreatePayload,
    ProductUpdatePayload,
    ProductCompanyInfo, // May not be explicitly used, but Product type relies on it
    ProductCompanyLinkDetail
} from "@/lib/types/product"; // Adjust path as needed
import { Company } from "@/lib/types/company"; // Adjust path as needed
import { MeasurementUnit, MeasurementUnitEnum, getEnumValues } from "@/lib/enums"; // Adjust path as needed

// --- API Functions ---
import {
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct, // Keep if you intend to add delete functionality
    fetchProductCompanies,
    linkProductToCompany,
    detachProductFromCompany,
    getProductByRetailId // Keep if needed elsewhere, not directly used here after fixes
} from "@/lib/api/admin/product"; // Adjust path to api/product.ts
import { fetchCompanies } from "@/lib/api/admin/company"; // Adjust path to api/company.ts

// --- Components ---
import SimpleTable from "@/components/managementComponent/simpleTable"; // Adjust path
import SimpleForm from "@/components/managementComponent/simpleform"; // Adjust path
import EntityLinkForm from "@/components/managementComponent/entityLinkForm"; // Adjust path
import ManagementContainer from "@/components/managementComponent/managementContainer"; // Adjust path

// --- Icons ---
import { Plus } from "lucide-react";

// --- Constants ---
const ITEMS_PER_PAGE = 10;

// --- Type Definitions ---
type ProductFormState = {
    retail_id?: string;
    src_product_id?: string;
    english_name?: string;
    spanish_name?: string;
    amount?: string;
    weight?: string;
    measurement?: string; // Stores enum value as string
};

// --- Component ---
const ProductManagement: React.FC = () => {
    // --- State Hooks ---
    const [products, setProducts] = useState<Product[]>([]);
    const [allCompanies, setAllCompanies] = useState<Company[]>([]); // For potential future use
    const [selectedCompanies, setSelectedCompanies] = useState<{ id: string; name: string; price?: number | null }[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [currentProductId, setCurrentProductId] = useState<string | null>(null);

    const initialFormState: ProductFormState = {
        retail_id: "",
        src_product_id: "",
        english_name: "",
        spanish_name: "",
        amount: "1",
        weight: "",
        measurement: MeasurementUnit.GRAM, // Default 'g'
    };
    const [productForm, setProductForm] = useState<ProductFormState>(initialFormState);

    // --- Utility Functions ---
    const parseEuropeanNumber = useCallback((str: string | undefined): number | undefined => {
        if (!str?.trim()) { return undefined; }
        const normalizedStr = str.replace(',', '.');
        const num = parseFloat(normalizedStr);
        return isNaN(num) ? undefined : num;
    }, []);

     const formatNumberToEuropeanString = useCallback((num: number | null | undefined): string => {
        if (num === undefined || num === null) { return ""; }
        return num.toString().replace('.', ',');
    }, []);

    const prepareApiPayload = useCallback((): ProductCreatePayload | ProductUpdatePayload => {
        return {
            retail_id: productForm.retail_id?.trim() || null,
            src_product_id: productForm.src_product_id?.trim() || null,
            english_name: productForm.english_name?.trim() || undefined,
            spanish_name: productForm.spanish_name?.trim() || null,
            amount: parseEuropeanNumber(productForm.amount),
            weight: parseEuropeanNumber(productForm.weight),
            measurement: productForm.measurement as MeasurementUnitEnum || undefined,
        };
    }, [productForm, parseEuropeanNumber]);

    const formatApiDataToFormState = useCallback((productData: Product): ProductFormState => {
        return {
            retail_id: productData.retail_id ?? "",
            src_product_id: productData.src_product_id ?? "",
            english_name: productData.english_name ?? "",
            spanish_name: productData.spanish_name ?? "",
            amount: formatNumberToEuropeanString(productData.amount),
            weight: formatNumberToEuropeanString(productData.weight),
            measurement: productData.measurement ?? "",
        };
    }, [formatNumberToEuropeanString]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductForm(prevState => ({ ...prevState, [name]: value }));
     };

    // --- Effects ---
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const { products: fetchedProducts, total } = await fetchProducts(currentPage, ITEMS_PER_PAGE);
                if (!fetchedProducts) {
                    console.error("No products data received");
                    setProducts([]); setTotalProducts(0); return;
                }
                setProducts(fetchedProducts);
                setTotalProducts(total);
            } catch (error) {
                console.error("Error fetching products:", error);
                 setProducts([]); setTotalProducts(0);
            }
        };
        loadProducts();
    }, [currentPage]);

    useEffect(() => {
        if (!currentProductId) {
            setSelectedCompanies([]); return;
        }
        const loadProductCompanies = async () => {
            try {
                const linkedCompaniesData = await fetchProductCompanies(currentProductId);
                // Correctly map ProductCompanyLinkDetail[]
                setSelectedCompanies(
                    linkedCompaniesData.map((c) => ({ // Removed incorrect type annotation for 'c'
                        id: c.company_id,
                        name: c.company_name,
                        price: c.price
                    }))
                );
            } catch (error) {
                console.error("Failed to fetch linked companies:", error);
                setSelectedCompanies([]);
            }
        };
        loadProductCompanies();
    }, [currentProductId]);

     useEffect(() => {
        const loadAllCompanies = async () => {
            try {
                const { companies: fetchedCompanies } = await fetchCompanies(1, 1000);
                setAllCompanies(fetchedCompanies);
            } catch (error) {
                console.error("Error fetching all companies:", error);
            }
        };
        // loadAllCompanies(); // Uncomment if needed
    }, []);


    // --- Event Handlers ---
    const handleAdd = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = prepareApiPayload() as ProductCreatePayload;
        if (!payload.english_name) { console.warn("English Name is required."); return; }
        try {
            const newProduct = await createProduct(payload);
            if (newProduct) {
                setProducts((prev) => [newProduct, ...prev].slice(0, ITEMS_PER_PAGE));
                setTotalProducts((prev) => prev + 1);
                setSelectedRowId(newProduct.product_id);
                setCurrentProductId(newProduct.product_id);
                setProductForm(formatApiDataToFormState(newProduct));
                setSelectedCompanies([]); // Clear linked companies for new product
                console.log("Product created successfully:", newProduct);
            }
        } catch (error) { console.error("Error creating product:", error); }
    }, [prepareApiPayload, formatApiDataToFormState]);

    const handleEdit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProductId) return;
        const payload = prepareApiPayload() as ProductUpdatePayload;
        if (!payload.english_name) { console.warn("English Name is required."); return; }
        try {
            const updatedProduct = await updateProduct(currentProductId, payload);
            if (updatedProduct) {
                 const currentLinkedCompanies = products.find(p => p.product_id === currentProductId)?.companies || [];
                 setProducts((prev) => prev.map((p) => (p.product_id === currentProductId ? {...updatedProduct, companies: currentLinkedCompanies} : p)));
                 setProductForm(formatApiDataToFormState(updatedProduct));
                console.log("Product updated successfully:", updatedProduct);
            }
        } catch (error) { console.error("Failed to update product:", error); }
    }, [currentProductId, prepareApiPayload, formatApiDataToFormState, products]);

    const handleRowClick = useCallback((productData: Product) => {
        setSelectedRowId(productData.product_id);
        setCurrentProductId(productData.product_id);
        setProductForm(formatApiDataToFormState(productData));
    }, [formatApiDataToFormState]);

    const clearSelection = useCallback(() => {
        setSelectedRowId(null);
        setCurrentProductId(null);
        setProductForm(initialFormState);
        setSelectedCompanies([]);
    }, [initialFormState]);

    // --- Render ---
    return (
        <ManagementContainer
            title="Manage Products"
            actionButton={currentProductId ? (
                <button onClick={clearSelection} aria-label="Add New Product" className="your-button-styles">
                    <Plus size={20} /> New
                </button>
            ) : null}
            // headerContent prop removed for now, validation button isn't needed for Product
        >
             <form onSubmit={currentProductId ? handleEdit : handleAdd}>
                <SimpleForm
                    key={currentProductId || 'new-product'}
                    fields={[
                        { name: "english_name", type: "text", placeholder: "English Name", required: true },
                        { name: "spanish_name", type: "text", placeholder: "Spanish Name" },
                        { name: "retail_id", type: "text", placeholder: "Retail ID" },
                        { name: "src_product_id", type: "text", placeholder: "Source Product ID (UUID)" },
                        { name: "amount", type: "number", placeholder: "Amount (e.g. 1 or 10,5)" },
                        { name: "weight", type: "number", placeholder: "Weight (e.g. 100,0)" },
                    ]}
                    state={productForm}
                    setState={(update) => setProductForm(prev => ({ ...prev, ...update }))}
                    onAdd={() => {}}
                    onEdit={() => {}}
                    addLabel=""
                    editLabel=""
                    isEditMode={!!currentProductId}
                />

                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                     <label htmlFor="measurement" style={{ marginRight:'0.5rem', display:'block', marginBottom:'0.25rem' }}>Measurement Unit:</label>
                     <select
                        id="measurement"
                        name="measurement"
                        value={productForm.measurement}
                        onChange={handleFormChange}
                        style={{ padding: '8px', minWidth: '200px' }}
                      >
                         <option value="">Select Unit</option>
                         {getEnumValues(MeasurementUnit).map(unit => <option key={unit} value={unit}>{unit}</option>)}
                     </select>
                 </div>

                 <button type="submit" className="your-main-submit-button-styles" style={{ marginTop: '1rem' }}>
                    {currentProductId ? "Update Product" : "Add Product"}
                 </button>
            </form>

            {currentProductId && (
                <EntityLinkForm
                    title="Link Product to Company"
                    placeholder="Enter Company Name to Link"
                    selectedEntities={selectedCompanies}
                    setSelectedEntities={setSelectedCompanies}
                    disabled={!currentProductId}
                    onEntityAdd={async (companyName) => {
                        if (!companyName.trim()) return null;
                        const linkResult = await linkProductToCompany(currentProductId!, companyName.trim(), null); // Price = null
                        if (linkResult) {
                             const newEntry = { id: linkResult.company_id, name: linkResult.company_name, price: linkResult.price };
                             setSelectedCompanies(prev => [...prev, newEntry]);
                             return newEntry;
                        }
                        console.error(`Failed to link company "${companyName}"`);
                        return null;
                    }}
                    onEntityRemove={async (company) => {
                        const success = await detachProductFromCompany(currentProductId!, company.id);
                        if (success) {
                             setSelectedCompanies((prev) => prev.filter((c) => c.id !== company.id));
                             console.log(`Detached company ${company.id}`);
                        } else {
                             console.error(`Failed to detach company ${company.id}`);
                        }
                    }}
                    // entityDisplayComponent prop removed as it doesn't exist on EntityLinkForm
                />
            )}

            <SimpleTable
                title="Product List"
                columns={["English Name", "Spanish Name", "Amount", "Weight", "Unit"]}
                data={products.map((p) => ({
                    id: p.product_id,
                    values: [
                        p.english_name || "N/A",
                        p.spanish_name || "N/A",
                        p.amount ?? "N/A",
                        p.weight ?? "N/A",
                        p.measurement || "N/A",
                    ],
                }))}
                totalItems={totalProducts}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                selectedRowId={selectedRowId}
                onRowClick={(item) => {
                    const selectedProduct = products.find((p) => p.product_id === item.id);
                    if (selectedProduct) { handleRowClick(selectedProduct); }
                }}
            />
        </ManagementContainer>
    );
};

export default ProductManagement;