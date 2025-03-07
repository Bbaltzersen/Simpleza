"use client";

import React, { useEffect, useState } from "react";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import { fetchCompanies, createCompany, updateCompany, deleteCompany } from "@/lib/api/ingredient/company";
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  const [company, setCompany] = useState<Partial<Company>>({ name: "" });

  // Fetch companies when the page changes
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { companies, total } = await fetchCompanies(currentPage, ITEMS_PER_PAGE);
        setCompanies(companies);
        setTotalCompanies(total);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };

    loadCompanies();
  }, [currentPage]);

  // Handle Add
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.name?.trim()) return;

    try {
      const newCompany = await createCompany({ name: company.name.trim() });

      if (newCompany) {
        setCompanies((prev) => [...prev, newCompany]);
        setTotalCompanies((prev) => prev + 1);
        setCurrentCompanyId(newCompany.company_id);
        setCompany({ name: newCompany.name });
      }
    } catch (error) {
      console.error("Failed to create company:", error);
    }
  };

  // Handle Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId || !company.name?.trim()) return;

    try {
      const updatedCompany = await updateCompany(currentCompanyId, { name: company.name.trim() });

      if (updatedCompany) {
        setCompanies((prev) =>
          prev.map((c) => (c.company_id === currentCompanyId ? updatedCompany : c))
        );
      }
    } catch (error) {
      console.error("Failed to update company:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (company_id: string) => {
    try {
      const success = await deleteCompany(company_id);
      if (success) {
        setCompanies((prev) => prev.filter((c) => c.company_id !== company_id));
        setTotalCompanies((prev) => prev - 1);
        if (currentCompanyId === company_id) {
          setCurrentCompanyId(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  };

  // Handle Row Click
  const handleRowClick = (company: Company) => {
    setSelectedRowId(company.company_id);
    setCurrentCompanyId(company.company_id);
    setCompany({ name: company.name });
  };

  const clearSelection = () => {
    setSelectedRowId(null);
    setCurrentCompanyId(null);
    setCompany({ name: "" });
};

  return (
    <ManagementContainer
            title="Manage Companies"
            actionButton={currentCompanyId && (
                <a onClick={clearSelection} aria-label="Clear Fields">
                    <Plus size={20} />
                </a>
            )}
        >
      {/* Company Form */}
      <SimpleForm
        fields={[
          { name: "name", type: "text", placeholder: "Company Name", required: true },
        ]}
        state={company}
        setState={setCompany}
        onAdd={handleAdd}
        addLabel="Add Company"
        isEditMode={!!currentCompanyId}
        onEdit={handleEdit}
        editLabel="Update Company"
      />

      {/* Company Table with Pagination */}
      <SimpleTable
        title="Company List"
        columns={["Company Name"]}
        data={companies.map((company) => ({
          id: company.company_id,
          values: [company.name],
        }))}
        totalItems={totalCompanies}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        selectedRowId={selectedRowId}
        onRowClick={(item) => {
          setSelectedRowId(item.id);
          const selectedCompany = companies.find((c) => c.company_id === item.id);
          if (selectedCompany) {
            handleRowClick(selectedCompany);
          }
        }}
      />
    </ManagementContainer>
  );
};

export default CompanyManagement;
