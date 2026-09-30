'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  X,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_META,
  VENUE_LABELS,
} from '@/lib/data';
import HighlightMatch from '@/components/HighlightMatch';

export default function DashboardView() {
  const {
    documents,
    events,
    incomingCount,
    reviewCount,
    overdueDocs,
    overdueCount,
    approvedCount,
    filteredDocuments,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterSla,
    setFilterSla,
    filterOffice,
    setFilterOffice,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    hasAttachmentsFilter,
    setHasAttachmentsFilter,
    activeFilterCount,
    resetAllFilters,
    setSelectedDoc,
    setNewEventOpen,
  } = useApp();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Collect distinct originating offices
  const distinctOffices = useMemo(() => {
    const standardOffices = [
      'Office of the Municipal Mayor',
      'Office of the Municipal Administrator',
      'Municipal Planning and Development Office (MPDO)',
      'Municipal Engineering Office',
      'Municipal Budget Office',
      'Municipal Accounting Office',
      'Human Resource Management Office',
      'Sangguniang Bayan',
      'Municipal Legal Office',
      'Municipal Social Welfare and Development Office (MSWDO)',
      'Municipal Disaster Risk Reduction and Management Office (MDRRMO)',
      'Barangay Poblacion',
      'Philippine National Police (PNP Santa Maria)',
    ];
    const fromDocs = documents.map((d) => d.originOffice).filter(Boolean);
    return Array.from(new Set([...standardOffices, ...fromDocs])).sort();
  }, [documents]);

  // Quick Preset Handlers
  const handleQuickFilter = (type: 'ALL' | 'OVERDUE' | 'SCREENING' | 'REVIEW' | 'TRANSMIT' | 'CLOSED' | 'ATTACHMENTS') => {
    resetAllFilters();
    if (type === 'OVERDUE') setFilterSla('OVERDUE');
    if (type === 'SCREENING') setFilterStatus('SCREENING');
    if (type === 'REVIEW') setFilterStatus('REVIEW');
    if (type === 'TRANSMIT') setFilterStatus('APPROVED');
    if (type === 'CLOSED') setFilterStatus('CLOSED');
    if (type === 'ATTACHMENTS') setHasAttachmentsFilter('WITH_ATTACHMENTS');
  };

  return (
    <div className="space-y-6 animate-fluid-tab">
      {/* Executive Operations HUD */}
      <section className="executive-operations-hud card-fluid">
        <div className="hud-cell">
          <span className="hud-section-label">SEC. I - REGISTRY INFLUX</span>
          <div className="hud-number-row">
            <span className="hud-number">{documents.length}</span>
            <span className="text-xs font-semibold text-[#86EFAC]">Total Logged</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            {incomingCount} in screening queue
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. II - SIGNATURE DESK</span>
          <div className="hud-number-row">
            <span className="hud-number text-[#FCD116]">{reviewCount}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">For Review</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            {approvedCount} cleared this week
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. III - ARTA SLA INTEGRITY</span>
          <div className="hud-number-row">
            <span className="hud-number text-[#FFFFFF]">{overdueCount}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">Escalated</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            RA 11032 3-Day Mandate
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. IV - VENUES & LOGISTICS</span>
          <div className="hud-number-row">
            <span className="hud-number">{events.length}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">Gavel Events</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            6 Municipal Venues active
          </span>
        </div>
      </section>

      {/* Administrative Action Memorandum */}
      {overdueDocs.length > 0 && (
        <section className="arta-memo-docket card-fluid">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#081E36] text-white rounded">
                  STATUTORY ARTA DIRECTIVE
                </span>
                <span className="text-xs font-bold text-[#475569]">
                  Republic Act No. 11032 - Section 21
                </span>
              </div>
              <h3 className="font-serif-docket text-base font-bold text-[#0F172A]">
                Memorandum of Overdue Transaction: {overdueDocs[0].title}
              </h3>
              <p className="text-xs text-[#475569] mt-1 max-w-3xl leading-relaxed">
                The 72-hour turnaround threshold mandated by the Ease of Doing Business Act has
                expired for control docket <strong>[{overdueDocs[0].controlNumber}]</strong>.
                Transmitted to the Office of the Municipal Administrator for immediate statutory resolution.
              </p>
            </div>

            <button
              onClick={() => setSelectedDoc(overdueDocs[0])}
              className="btn-fluid px-4 py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer shadow shrink-0"
            >
              Examine Docket
            </button>
          </div>
        </section>
      )}

      {/* Asymmetric Civic Ledger Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Balance Sheet */}
        <div className="bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#081E36]">
              Statutory Document Classification
            </h3>
            <span className="font-mono text-[11px] text-[#64748B]">Active Ledger</span>
          </div>

          <div className="space-y-2 text-xs">
            {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([catKey, label]) => {
              const count = documents.filter((d) => d.category === catKey).length;
              return (
                <div
                  key={catKey}
                  onClick={() => {
                    resetAllFilters();
                    setFilterCategory(catKey);
                  }}
                  className="flex items-center justify-between p-2 hover:bg-[#F8FAFC] rounded border border-transparent hover:border-[#E2E8F0] cursor-pointer transition-colors"
                  title={`Filter by ${label}`}
                >
                  <span className="font-medium text-[#334155]">{label}</span>
                  <span className="font-mono font-bold text-[#081E36] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Venue & Gavel Dispatch */}
        <div className="lg:col-span-2 bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#081E36]">
              Municipal Venue & Executive Gavel Dispatch
            </h3>
            <button
              onClick={() => setNewEventOpen(true)}
              className="text-xs font-bold text-[#15803D] hover:underline cursor-pointer"
            >
              Schedule Gavel
            </button>
          </div>

          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] text-xs space-y-1">
                <div className="font-bold text-[#081E36]">No Municipal Venues Currently Reserved</div>
                <p>Schedule executive proceedings or conference room bookings above.</p>
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                        {VENUE_LABELS[evt.venue]?.label}
                      </span>
                      <span className="font-mono text-[11px] text-[#64748B]">
                        {evt.date} | {evt.startTime} - {evt.endTime}
                      </span>
                      {evt.involvesMayor && (
                        <span className="text-[10px] font-bold text-[#081E36] bg-[#E2E8F0] border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                          MAYOR PRESIDING
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-[#0F172A]">{evt.title}</div>
                    <div className="text-[#64748B] text-[11px]">
                      Organizer: {evt.organizer} ({evt.department})
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-1 rounded border border-[#86EFAC]">
                    CONFIRMED
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Municipal Docket Ledger Table with Comprehensive Search Engine */}
      <div className="bg-white rounded border border-[#CBD5E1] shadow-sm overflow-hidden space-y-0">
        {/* Search & Filter Command Toolbar */}
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-sm font-bold text-[#081E36]">
                  MUNICIPAL DOCKET LEDGER TABLE
                </h3>
                {activeFilterCount > 0 && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                    {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''} Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B]">
                Official chronological registry of incoming communications, executive orders, and municipal transactions.
              </p>
            </div>

            {/* Quick Search Input with Clear Button */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search docket, party, office, draft, annex..."
                  className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] bg-white text-[#0F172A]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
                    title="Clear search query"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Advanced Filter Drawer Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={`btn-fluid flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-semibold cursor-pointer transition-colors ${
                  showAdvancedFilters || activeFilterCount > 0
                    ? 'bg-[#081E36] text-white border-[#081E36]'
                    : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                }`}
                title="Toggle advanced multi-parameter filters"
              >
                <SlidersHorizontal size={13} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-[#FCD116] text-[#081E36] rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                {showAdvancedFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Minimalist Filter Presets Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
            <button
              onClick={() => handleQuickFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                activeFilterCount === 0 && !searchQuery
                  ? 'bg-[#081E36] text-white font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#081E36] hover:bg-[#E2E8F0]/60'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => handleQuickFilter('OVERDUE')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                filterSla === 'OVERDUE'
                  ? 'bg-[#081E36] text-white font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#081E36] hover:bg-[#E2E8F0]/60'
              }`}
            >
              Overdue ({overdueCount})
            </button>
            <button
              onClick={() => handleQuickFilter('SCREENING')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                filterStatus === 'SCREENING'
                  ? 'bg-[#081E36] text-white font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#081E36] hover:bg-[#E2E8F0]/60'
              }`}
            >
              Screening ({incomingCount})
            </button>
            <button
              onClick={() => handleQuickFilter('REVIEW')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                filterStatus === 'REVIEW'
                  ? 'bg-[#081E36] text-white font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#081E36] hover:bg-[#E2E8F0]/60'
              }`}
            >
              Review ({reviewCount})
            </button>
            <button
              onClick={() => handleQuickFilter('TRANSMIT')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                filterStatus === 'APPROVED'
                  ? 'bg-[#081E36] text-white font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#081E36] hover:bg-[#E2E8F0]/60'
              }`}
            >
              Transmit ({approvedCount})
            </button>
            <button
              onClick={() => handleQuickFilter('ATTACHMENTS')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                hasAttachmentsFilter === 'WITH_ATTACHMENTS'
                  ? 'bg-[#081E36] text-white font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#081E36] hover:bg-[#E2E8F0]/60'
              }`}
            >
              With Annexes
            </button>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="p-3.5 bg-white border border-[#CBD5E1] rounded mt-2 space-y-3 animate-fluid-fade">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                <span className="font-bold text-xs text-[#081E36] uppercase tracking-wider">
                  Parametric Registry Filter Options
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Filter across date ranges, departments, statutory SLA status, and classifications
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Origin Office Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-[#334155] block">Originating Office / Dept</label>
                  <select
                    value={filterOffice}
                    onChange={(e) => setFilterOffice(e.target.value)}
                    className="w-full p-1.5 border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="ALL">All Municipal Offices</option>
                    {distinctOffices.map((off, idx) => (
                      <option key={idx} value={off}>
                        {off}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Document Classification / Type */}
                <div className="space-y-1">
                  <label className="font-bold text-[#334155] block">Document Classification</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-1.5 border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="ALL">All Document Classifications</option>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.label} ({meta.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Statutory SLA Status */}
                <div className="space-y-1">
                  <label className="font-bold text-[#334155] block">Statutory SLA Compliance</label>
                  <select
                    value={filterSla}
                    onChange={(e) => setFilterSla(e.target.value)}
                    className="w-full p-1.5 border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="ALL">All SLA Statuses</option>
                    <option value="OVERDUE">Overdue (Expired 72hr Mandate)</option>
                    <option value="DUE_TODAY">Due Today (Within 24 Hours)</option>
                    <option value="WITHIN_SLA">Within Normal SLA Threshold</option>
                  </select>
                </div>

                {/* 4. Priority Level */}
                <div className="space-y-1">
                  <label className="font-bold text-[#334155] block">Document Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full p-1.5 border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="ALL">All Priority Levels</option>
                    <option value="URGENT">Urgent Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="NORMAL">Normal Priority</option>
                  </select>
                </div>

                {/* 5. Date Received From */}
                <div className="space-y-1">
                  <label className="font-bold text-[#334155] block">Date Received (From)</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full p-1.5 border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                {/* 6. Date Received To */}
                <div className="space-y-1">
                  <label className="font-bold text-[#334155] block">Date Received (To)</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full p-1.5 border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                {/* 7. Attachment & Scanning Presence */}
                <div className="space-y-1">
                  <label className="font-bold text-[#334155] block">Annexes & Digitized Scans</label>
                  <select
                    value={hasAttachmentsFilter}
                    onChange={(e) => setHasAttachmentsFilter(e.target.value)}
                    className="w-full p-1.5 border border-[#CBD5E1] rounded bg-white text-[#0F172A] focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="ALL">All (With or Without Annexes)</option>
                    <option value="WITH_ATTACHMENTS">Has Uploaded Annex Files</option>
                    <option value="WITH_SCANS">Has Digitized Camera/Feeder Scans</option>
                    <option value="WITHOUT_ATTACHMENTS">No Annexes Attached</option>
                  </select>
                </div>

                {/* 8. Reset Action */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="w-full p-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#081E36] font-bold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Results Summary Header */}
        <div className="px-4 py-2 bg-white border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <div>
            Showing <strong>{filteredDocuments.length}</strong> of <strong>{documents.length}</strong> registered dockets
            {searchQuery && (
              <span> matching &quot;<strong>{searchQuery}</strong>&quot;</span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="text-[#15803D] hover:underline font-bold cursor-pointer"
            >
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="municipal-docket-table">
            <thead>
              <tr>
                <th>Docket No.</th>
                <th>Classification</th>
                <th>Document Subject / Particulars</th>
                <th>Requesting Party & Office</th>
                <th>Status</th>
                <th>Statutory SLA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#64748B] text-xs">
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <div className="font-bold text-sm text-[#081E36]">No Matching Dockets Found</div>
                      <p className="text-[11px] leading-relaxed">
                        No municipal records match the active search terms and parametric filters.
                        Try clearing or relaxing your filter parameters.
                      </p>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={resetAllFilters}
                          className="mt-2 btn-fluid px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const statusMeta = DOCUMENT_STATUS_META[doc.status];
                  return (
                    <tr key={doc.id}>
                      <td>
                        <span className="docket-control-badge font-mono">
                          <HighlightMatch text={doc.controlNumber} query={searchQuery} />
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-xs text-[#334155]">
                          {DOCUMENT_TYPE_LABELS[doc.type]?.label || doc.type}
                        </span>
                      </td>
                      <td>
                        <div className="docket-title-cell max-w-md">
                          <div className="font-bold text-[#0F172A]">
                            <HighlightMatch text={doc.title} query={searchQuery} />
                          </div>
                          {doc.attachments && doc.attachments.length > 0 && (
                            <div className="text-[10px] text-[#15803D] flex items-center gap-1 mt-0.5">
                              <Paperclip size={10} />
                              <span>{doc.attachments.length} attached annex{doc.attachments.length > 1 ? 'es' : ''}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-xs text-[#0F172A]">
                          <HighlightMatch text={doc.requestingParty} query={searchQuery} />
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          <HighlightMatch text={doc.originOffice} query={searchQuery} />
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${statusMeta?.badgeCls || 'badge-received'}`}>
                          {statusMeta?.label || doc.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`font-mono text-xs font-bold ${
                            doc.isOverdue ? 'text-[#081E36]' : 'text-[#15803D]'
                          }`}
                        >
                          {doc.isOverdue ? 'OVERDUE' : '3 Days Valid'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="btn-fluid px-3 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                          title="Examine complete docket dossier"
                        >
                          Examine
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
