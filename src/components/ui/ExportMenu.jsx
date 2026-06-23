/**
 * ExportMenu — One-click export for the EzHire recruiter workspace.
 * Supports exporting All, Selected, or Search Results to Excel (.xlsx) or CSV.
 */

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, ChevronDown, FileSpreadsheet, FileText, CheckSquare, Database, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

// Fields to export
const EXPORT_FIELDS = [
  { key: 'name',       label: 'Name',        getter: c => c['Candidate Name'] || c.name || '' },
  { key: 'email',      label: 'Email',       getter: c => c['Email'] || c.email || '' },
  { key: 'phone',      label: 'Phone',       getter: c => c['Contact No'] || c.phone || '' },
  { key: 'title',      label: 'Title',       getter: c => c['Title'] || c.role || '' },
  { key: 'skills',     label: 'Skills',      getter: c => c['Skills'] || c.skills || '' },
  { key: 'experience', label: 'Experience',  getter: c => c.experience_years || c.experience || '' },
  { key: 'visa',       label: 'Visa Status', getter: c => c['VISA'] || c.visa || '' },
  { key: 'workPref',   label: 'Work Pref',   getter: c => c.work_preference || c.workPref || '' },
  { key: 'availability',label:'Availability',getter: c => c.availability || c.availableFrom || '' },
  { key: 'linkedin',   label: 'LinkedIn',    getter: c => c['LinkedIn'] || c.linkedin || '' },
  { key: 'location',   label: 'Location',    getter: c => c['Current Location'] || c.location || '' },
  { key: 'resume_url', label: 'Resume URL',  getter: c => c.resume_url || c['Resume URL'] || '' },
];

function buildRows(candidates) {
  return candidates.map(c =>
    Object.fromEntries(EXPORT_FIELDS.map(f => [f.label, f.getter(c)]))
  );
}

function downloadCSV(candidates, filename = 'ezhire_export') {
  const rows = buildRows(candidates);
  const headers = EXPORT_FIELDS.map(f => f.label);
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] || '').replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    ),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadXLSX(candidates, filename = 'ezhire_export') {
  const rows = buildRows(candidates);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = EXPORT_FIELDS.map((f, i) => ({
    wch: Math.max(f.label.length, 16),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── ExportMenu Component ─────────────────────────────────────────────────────
export default function ExportMenu({ allCandidates = [], selectedCandidates = [], searchResults = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleExport(candidates, format, label) {
    if (!candidates || candidates.length === 0) {
      toast.error(`No candidates to export (${label})`);
      return;
    }
    const filename = `ezhire_${label.toLowerCase().replace(/\s/g, '_')}`;
    if (format === 'csv') {
      downloadCSV(candidates, filename);
    } else {
      downloadXLSX(candidates, filename);
    }
    toast.success(`Exported ${candidates.length} candidates as ${format.toUpperCase()}`);
    setOpen(false);
  }

  const hasSelected = selectedCandidates.length > 0;
  const hasResults  = searchResults.length > 0;

  const menuItems = [
    {
      group: 'Export All Database',
      icon: <Database size={13} />,
      candidates: allCandidates,
      label: 'all_candidates',
      count: allCandidates.length,
    },
    ...(hasResults ? [{
      group: 'Export Search Results',
      icon: <Filter size={13} />,
      candidates: searchResults,
      label: 'search_results',
      count: searchResults.length,
    }] : []),
    ...(hasSelected ? [{
      group: 'Export Selected',
      icon: <CheckSquare size={13} />,
      candidates: selectedCandidates,
      label: 'selected',
      count: selectedCandidates.length,
    }] : []),
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height: 36,
          padding: '0 14px',
          fontSize: 13,
          fontWeight: 500,
          color: '#1A1A2E',
          background: '#fff',
          border: '1px solid #E8E6F0',
          borderRadius: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.15s ease',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4BFEA'; e.currentTarget.style.background = '#F7F6FB'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E6F0'; e.currentTarget.style.background = '#fff'; }}
      >
        <Download size={14} style={{ color: '#6C5CE7' }} />
        Export
        <ChevronDown size={12} style={{ color: '#6B6B8A', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: '#fff',
          border: '1px solid #E8E6F0',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '8px',
          zIndex: 200,
          minWidth: 260,
          animation: 'fadeIn 0.15s ease',
        }}>
          {menuItems.map((item, idx) => (
            <div key={idx} style={{ marginBottom: idx < menuItems.length - 1 ? 4 : 0 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#A0A0B8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '6px 8px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {item.icon}
                {item.group}
                <span style={{
                  background: '#F0EEFF',
                  color: '#6C5CE7',
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {item.count}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4, padding: '0 4px 6px' }}>
                <button
                  onClick={() => handleExport(item.candidates, 'xlsx', item.label)}
                  style={{
                    flex: 1,
                    height: 34,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#1A1A2E',
                    background: '#F7F6FB',
                    border: '1px solid #E8E6F0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8F5E9'; e.currentTarget.style.borderColor = '#A5D6A7'; e.currentTarget.style.color = '#2E7D32'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F7F6FB'; e.currentTarget.style.borderColor = '#E8E6F0'; e.currentTarget.style.color = '#1A1A2E'; }}
                >
                  <FileSpreadsheet size={13} />
                  Excel
                </button>
                <button
                  onClick={() => handleExport(item.candidates, 'csv', item.label)}
                  style={{
                    flex: 1,
                    height: 34,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#1A1A2E',
                    background: '#F7F6FB',
                    border: '1px solid #E8E6F0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E3F2FD'; e.currentTarget.style.borderColor = '#90CAF9'; e.currentTarget.style.color = '#1565C0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F7F6FB'; e.currentTarget.style.borderColor = '#E8E6F0'; e.currentTarget.style.color = '#1A1A2E'; }}
                >
                  <FileText size={13} />
                  CSV
                </button>
              </div>
              {idx < menuItems.length - 1 && (
                <div style={{ height: 1, background: '#F0EFF8', margin: '4px 4px 8px' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
