"use client";

import React, { useState } from "react";
import { Company } from "@/lib/types/company";
import SimpleTable from "@/components/managementComponent/simpleTable";

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Partial<Company>>({
    name: "",
  });

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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Companies</h2>

      {/* Company Form */}
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Company Name"
          value={company.name || ""}
          onChange={(e) => setCompany({ ...company, name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          Add Company
        </button>
      </form>

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
