"use client";

import React from "react";
import { Company } from "@/lib/types/company";

const CompanyManagement: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Companies</h2>

      {/* Add Company Form */}
      <div className="mb-4">
        <p>[Form for adding companies]</p>
      </div>

      {/* List of Companies */}
      <ul className="border p-4">
        <p>[List of existing companies]</p>
      </ul>
    </div>
  );
};

export default CompanyManagement;
