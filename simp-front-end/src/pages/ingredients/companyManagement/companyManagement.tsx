"use client";

import React, { useState } from "react";
import { Company } from "@/lib/types/company";

const ITEMS_PER_PAGE = 20;

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Partial<Company>>({
    name: "",
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  // Filter companies based on search query
  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate the results
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

      <h2 className="text-xl font-bold mb-4">Company List</h2>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search companies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      {/* Companies Table */}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Company Name</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCompanies.length === 0 ? (
              <tr>
                <td className="text-center p-4">No companies found.</td>
              </tr>
            ) : (
              paginatedCompanies.map((company) => (
                <tr key={company.company_id} className="border-b">
                  <td className="border p-2">{company.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`p-2 ${currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white"}`}
        >
          Previous
        </button>
        <span className="p-2">
          Page {currentPage} of {Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)))}
          disabled={currentPage >= Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)}
          className={`p-2 ${currentPage >= Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE) ? "bg-gray-300" : "bg-blue-500 text-white"}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CompanyManagement;
