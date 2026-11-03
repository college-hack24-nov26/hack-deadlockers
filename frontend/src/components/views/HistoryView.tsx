import React, { useState } from 'react';
import { CallRecord } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  PhoneCall, 
  Globe, 
  Clock, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface HistoryViewProps {
  calls: CallRecord[];
  onInspectCall: (call: CallRecord) => void;
  triggerToast: (msg: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  calls,
  onInspectCall,
  triggerToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filtered = calls.filter((c) => {
    const matchesSearch = 
      c.callerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.scamType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = 
      severityFilter === 'All' || c.riskLevel.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    triggerToast('Forensic records exported: scamchain_audit_export.csv');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Title & Search Controls */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-2.5">
              <History className="w-5 h-5 text-[#0071E3]" />
              Call Records & Forensic History
            </h2>
            <p className="text-xs text-[#86868B] mt-1 font-sans">
              Recorded calls, detected deception patterns, and real-time risk assessments.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] text-xs font-semibold transition-colors self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-[#0071E3]" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#86868B] absolute left-4 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Caller ID, Threat Category, Language..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[#F2F2F7] border border-transparent focus:border-[#0071E3] text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#86868B] flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </span>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
              className="px-3.5 py-2 rounded-full bg-[#F2F2F7] text-xs text-[#1D1D1F] focus:outline-none font-medium"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical (&gt;= 80%)</option>
              <option value="High">High (60-79%)</option>
              <option value="Medium">Medium (30-59%)</option>
              <option value="Low">Low (&lt; 30%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[#86868B] uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3">Call Dossier</th>
                <th className="py-3 px-3">Timestamp / Duration</th>
                <th className="py-3 px-3">Language</th>
                <th className="py-3 px-3">Risk Index</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#86868B] italic">
                    No forensic call records matched the query.
                  </td>
                </tr>
              ) : (
                paginated.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#1D1D1F] font-mono flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-[#0071E3]" />
                        {call.callerId}
                      </div>
                      <div className="text-[10px] text-[#86868B] mt-0.5">{call.id}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-[#1D1D1F] font-medium">{call.timestamp}</div>
                      <div className="text-[10px] text-[#86868B] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {call.duration}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Globe className="w-3.5 h-3.5 text-[#0071E3]" /> {call.language}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <RiskBadge level={call.riskLevel} score={call.riskScore} size="sm" />
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#1D1D1F]">{call.scamType}</div>
                      <div className="text-[10px] text-[#86868B] truncate max-w-xs mt-0.5">
                        {call.tactics.length} tactics detected
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        call.status === 'Blocked'
                          ? 'bg-red-50 text-[#FF3B30] border border-red-200'
                          : call.status === 'Flagged'
                          ? 'bg-amber-50 text-[#FF9500] border border-amber-200'
                          : 'bg-emerald-50 text-[#34C759] border border-emerald-200'
                      }`}>
                        {call.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onInspectCall(call)}
                        className="px-3.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0071E3] text-xs transition-colors font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-[#86868B]">
          <div>
            Showing <b className="text-[#1D1D1F]">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b> to <b className="text-[#1D1D1F]">{Math.min(currentPage * itemsPerPage, filtered.length)}</b> of <b className="text-[#1D1D1F]">{filtered.length}</b> total records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
