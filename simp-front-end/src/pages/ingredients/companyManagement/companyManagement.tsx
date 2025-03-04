"use client";

import React, { useEffect, useState } from "react";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import { fetchCompanies, createCompany, deleteCompany } from "@/lib/api/ingredient/company";

interface FormField {
  name: keyof Company;
  type: "text";
  placeholder: string;
  required?: boolean;
}

const ITEMS_PER_PAGE = 10;

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Partial<Company>>({ name: "" });
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch companies when the page changes
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { companies, total } = await fetchCompanies(currentPage, ITEMS_PER_PAGE);
        setCompanies(companies.map(company => ({ ...company, id: company.company_id })));
        setTotalCompanies(total);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };

    loadCompanies();
  }, [currentPage]); // ✅ Runs on page change

  // Form Fields
  const companyFields: FormField[] = [{ name: "name", type: "text", placeholder: "Company Name", required: true }];

  // Handle Company Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.name?.trim()) return;

    try {
      const newCompany = await createCompany({ name: company.name.trim() });
      if (newCompany) {
        // If the current page is full, move to the next page
        const isLastPage = companies.length >= ITEMS_PER_PAGE;
        if (isLastPage) {
          setCurrentPage((prev) => prev + 1);
        } else {
          setCompanies((prev) => [...prev, { ...newCompany, id: newCompany.company_id }]);
        }

        setCompany({ name: "" }); // Reset input field
        setTotalCompanies((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to create company:", error);
    }
  };

  // Handle Company Deletion
  const handleDelete = async (company_id: string) => {
    try {
      const success = await deleteCompany(company_id);
      if (success) {
        setCompanies((prev) => prev.filter((c) => c.company_id !== company_id));
        setTotalCompanies((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  };

  return (
    <ManagementContainer title="Manage Companies">
      {/* Use Reusable Form */}
      <SimpleForm
        fields={companyFields}
        state={company}
        setState={setCompany}
        onSubmit={handleSubmit}
        submitLabel="Add Company"
      />

      {/* Company Table with Pagination */}
      <SimpleTable
        title="Company List"
        columns={["Company Name", "Actions"]}
        data={companies.map(company => ({ ...company, id: company.company_id }))}
        totalItems={totalCompanies}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        searchableFields={["name"]}
        renderRow={(company) => (
          <tr key={company.company_id}>
            <td>{company.name}</td>
            <td>
              <button onClick={() => handleDelete(company.company_id)} className="text-red-600">Delete</button>
            </td>
          </tr>
        )} onRowClick={function (item: { id: string; company_id: string; name: string; price: number; }): void {
          throw new Error("Function not implemented.");
        } }      />
    </ManagementContainer>
  );
};

export default CompanyManagement;
