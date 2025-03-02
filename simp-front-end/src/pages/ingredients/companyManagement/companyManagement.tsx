"use client";

import React, { useState } from "react";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";

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

  const companyFields: FormField[] = [
    { name: "name", type: "text", placeholder: "Company Name", required: true },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCompany: Company = {
      company_id: crypto.randomUUID(),
      name: company.name || "",
    };
    setCompanies([...companies, newCompany]); 
    setCompany({ name: "" }); 
  };

  return (
    <ManagementContainer title="Manage Company">
      <SimpleForm
        // title="Add Company"
        fields={companyFields}
        state={company}
        setState={setCompany}
        onSubmit={handleSubmit}
        submitLabel="Add Company"
      />

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
    </ManagementContainer>
  );
};

export default CompanyManagement;