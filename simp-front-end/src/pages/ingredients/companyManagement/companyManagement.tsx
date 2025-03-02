"use client";

import React, { useEffect, useState, useRef } from "react";
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

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Partial<Company>>({ name: "" });
  const isFetched = useRef(false); // Prevent multiple fetch calls in development mode

  // Fetch companies when component loads
  useEffect(() => {
    if (isFetched.current) return; // Prevent duplicate fetch
    isFetched.current = true;

    const loadCompanies = async () => {
      try {
        const fetchedCompanies = await fetchCompanies();
        setCompanies(fetchedCompanies);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };

    loadCompanies();
  }, []);

  // Form Fields
  const companyFields: FormField[] = [{ name: "name", type: "text", placeholder: "Company Name", required: true }];

  // Handle Company Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.name?.trim()) return;

    try {
      const newCompany = await createCompany({ name: company.name.trim() });
      if (newCompany) {
        setCompanies((prev) => [...prev, newCompany]);
        setCompany({ name: "" }); // Reset input field
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

      {/* Use Reusable Table */}
      <SimpleTable
        title="Company List"
        columns={["Company Name"]}
        data={companies}
        searchableFields={["name"]}
        renderRow={(company) => (
          <tr key={company.company_id}>
            <td>{company.name}</td>
            <td>
              <button onClick={() => handleDelete(company.company_id)}>Delete</button>
            </td>
          </tr>
        )}
      />
    </ManagementContainer>
  );
};

export default CompanyManagement;
