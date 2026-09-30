'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, RotateCcw, Paperclip } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/data';
import HighlightMatch from '@/components/HighlightMatch';
import { filterAndSearchDocuments } from '@/lib/searchEngine';

export default function ArchiveView() {
  const { documents, closedCount, setSelectedDoc } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const archivedDocs = useMemo(() => {
    return documents.filter((d) => d.status === 'CLOSED');
  }, [documents]);

  const filteredArchived = useMemo(() => {
    const results = filterAndSearchDocuments(archivedDocs, {
      query: searchQuery,
      category: selectedCategory,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    return results.map((r) => r.item);
  }, [archivedDocs, searchQuery, selectedCategory, dateFrom, dateTo]);

  const activeFilters = Boolean(searchQuery || selectedCategory !== 'ALL' || dateFrom || dateTo);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE F: MUNICIPAL RECORDS ARCHIVE & RETRIEVAL
          </h3>
          <p className="text-xs text-[#64748B]">
            Digitized permanent repository of concluded municipal transactions, resolutions, and orders.
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-[#15803D] shrink-0 bg-[#F0FDF4] px-2.5 py-1 rounded border border-[#BBF7D0]">
          {closedCount} Archived Records
        </span>
      </div>

      {/* Archive Search & Parametric Filters */}
      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archived dockets by control number, subject, party, provisions..."
              className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-1.5 border border-[#CBD5E1] rounded text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#15803D]"
            >
              <option value="ALL">All Statutory Categories</option>
              {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
              className="p-1.5 border border-[#CBD5E1] rounded text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#15803D]"
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
              className="p-1.5 border border-[#CBD5E1] rounded text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#15803D]"
            />
          </div>

          {activeFilters && (
            <button
              onClick={handleResetFilters}
              className="btn-fluid px-2.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer flex items-center justify-center gap-1 shrink-0"
              title="Reset archive filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Results Count Line */}
        <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
          <span>
            Retrieved <strong>{filteredArchived.length}</strong> of <strong>{archivedDocs.length}</strong> archived records
            {searchQuery && (
              <span> matching &quot;<strong>{searchQuery}</strong>&quot;</span>
            )}
          </span>
          {activeFilters && (
            <span className="font-mono text-[11px] text-[#081E36] font-semibold">
              Filter Active
            </span>
          )}
        </div>

        {/* Archive Table */}
        <div className="overflow-x-auto">
          <table className="municipal-docket-table">
            <thead>
              <tr>
                <th>Control No.</th>
                <th>Subject Matter</th>
                <th>Category</th>
                <th>Origin & Requesting Party</th>
                <th>Concluding Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredArchived.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#64748B] text-xs">
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <div className="font-bold text-sm text-[#081E36]">No Archived Records Located</div>
                      <p className="text-[11px]">
                        {archivedDocs.length === 0
                          ? 'The municipal archive is clear. Concluded dockets and processed transactions will be permanently stored here.'
                          : 'No archived records match your query or category filters.'}
                      </p>
                      {activeFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 btn-fluid px-3 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArchived.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="docket-control-badge font-mono">
                        <HighlightMatch text={doc.controlNumber} query={searchQuery} />
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-xs text-[#0F172A] max-w-md">
                        <HighlightMatch text={doc.title} query={searchQuery} />
                      </div>
                      {doc.attachments && doc.attachments.length > 0 && (
                        <div className="text-[10px] text-[#15803D] flex items-center gap-1 mt-0.5">
                          <Paperclip size={10} />
                          <span>{doc.attachments.length} archived annex{doc.attachments.length > 1 ? 'es' : ''}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-[#334155]">
                        {DOCUMENT_CATEGORY_LABELS[doc.category] || doc.category}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-[#0F172A]">
                        <HighlightMatch text={doc.requestingParty} query={searchQuery} />
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        <HighlightMatch text={doc.originOffice} query={searchQuery} />
                      </div>
                    </td>
                    <td className="font-mono text-xs text-[#334155]">
                      {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                    </td>
                      <td>
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-3 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-xs btn-fluid transition-colors"
                          title="Open archived dossier and audit history"
                        >
                          Retrieve Dossier
                        </button>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

