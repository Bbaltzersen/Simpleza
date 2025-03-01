"use client";

import React, { useState } from "react";
import { Company } from "@/lib/types/company";

const CompanyManagement: React.FC = () => {
  const [company, setCompany] = useState<Partial<Company>>({
    name: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New Company:", company);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Companies</h2>

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
    </div>
  );
};

export default CompanyManagement;
