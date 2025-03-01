"use client";

import React, { useState } from "react";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";

interface FormField {
  name: keyof Company;
  type: "text";
  placeholder: string;
  required?: boolean;
}

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Partial<Company>>({
    name: "",
  });

  // Form Fields
  const companyFields: FormField[] = [
    { name: "name", type: "text", placeholder: "Company Name", required: true },
  ];

  // Handle Company Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCompany: Company = {
      company_id: crypto.randomUUID(),
      name: company.name || "",
    };
    setCompanies([...companies, newCompany]); // Add company to list
    setCompany({ name: "" }); // Reset input field
  };

  return (
    <div>
      <h2>Manage Companies</h2>

      {/* Use Reusable Form */}
      <SimpleForm
        title="Add Company"
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
          <tr key={company.company_id} className="border-b">
            <td className="border p-2">{company.name}</td>
          </tr>
        )}
      />
    </div>
  );
};

export default CompanyManagement;
