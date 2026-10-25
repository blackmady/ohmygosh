import React, { useState, useMemo } from 'react';
import { FileItem } from '../../types';
import Papa from 'papaparse';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, FileSpreadsheet, FileCode } from 'lucide-react';

interface CsvPreviewProps {
  currentFile: FileItem;
}

export const CsvPreview: React.FC<CsvPreviewProps> = ({ currentFile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewFormat, setViewFormat] = useState<'table' | 'raw'>('table');

  // Parse CSV
  const { headers, data, parseErrors } = useMemo(() => {
    try {
      const parsed = Papa.parse(currentFile.content.trim(), {
        skipEmptyLines: true,
      });

      const rows = (parsed.data as string[][]) || [];
      if (rows.length === 0) {
        return { headers: [], data: [], parseErrors: [] };
      }

      const rawHeaders = rows[0] || [];
      const body = rows.slice(1);

      return {
        headers: rawHeaders,
        data: body,
        parseErrors: parsed.errors,
      };
    } catch (err) {
      console.error('CSV parse error:', err);
      return { headers: [], data: [], parseErrors: [String(err)] };
    }
  }, [currentFile.content]);

  // Filtered and Sorted rows
  const filteredRows = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter((row) =>
        row.some((cell) => String(cell || '').toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortCol !== null && sortCol < headers.length) {
      result.sort((a, b) => {
        const valA = a[sortCol] ?? '';
        const valB = b[sortCol] ?? '';

        const numA = Number(valA);
        const numB = Number(valB);

        let cmp = 0;
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          cmp = numA - numB;
        } else {
          cmp = String(valA).localeCompare(String(valB));
        }

        return sortAsc ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchTerm, sortCol, sortAsc, headers.length]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleSort = (colIndex: number) => {
    if (sortCol === colIndex) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortCol(null);
        setSortAsc(true);
      }
    } else {
      setSortCol(colIndex);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    const blob = new Blob([currentFile.content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name.endsWith('.csv') ? currentFile.name : `${currentFile.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonObjects = data.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h || `col_${i}`] = row[i] ?? '';
      });
      return obj;
    });
    const blob = new Blob([JSON.stringify(jsonObjects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFile.name.replace(/\.[^/.]+$/, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      {/* CSV Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          {/* View format tabs */}
          <div className="flex items-center bg-neutral-800/80 rounded p-0.5">
            <button
              onClick={() => setViewFormat('table')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewFormat === 'table' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>数据表格</span>
            </button>
            <button
              onClick={() => setViewFormat('raw')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewFormat === 'raw' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>纯文本</span>
            </button>
          </div>

          {/* Search box */}
          {viewFormat === 'table' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="搜索整表单元格..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-7 pr-3 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-44"
              />
            </div>
          )}
        </div>

        {/* Action downloads */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-xs transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>导出 JSON</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-xs transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>导出 CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto bg-neutral-950">
        {viewFormat === 'raw' ? (
          <pre className="p-4 font-mono text-xs text-neutral-300 whitespace-pre overflow-auto">
            {currentFile.content}
          </pre>
        ) : headers.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">
            未检测到有效的 CSV 数据或内容为空。
          </div>
        ) : (
          <table className="w-full border-collapse text-xs font-sans">
            <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10 shadow-sm">
              <tr>
                <th className="py-2.5 px-3 text-left font-mono text-neutral-500 w-12 border-r border-neutral-800/80 bg-neutral-900/95">
                  #
                </th>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    onClick={() => handleSort(idx)}
                    className="py-2.5 px-3 text-left font-semibold text-neutral-300 border-r border-neutral-800/80 hover:bg-neutral-800 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{header || `Col ${idx + 1}`}</span>
                      <span className="text-neutral-500">
                        {sortCol === idx ? (
                          sortAsc ? (
                            <ArrowUp className="w-3 h-3 text-orange-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-orange-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="py-8 text-center text-neutral-500">
                    没有找到匹配搜索条件的数据
                  </td>
                </tr>
              ) : (
                currentRows.map((row, rIdx) => {
                  const globalIdx = (currentPage - 1) * pageSize + rIdx + 1;
                  return (
                    <tr
                      key={rIdx}
                      className="hover:bg-neutral-900/60 transition-colors odd:bg-neutral-950 even:bg-neutral-900/20"
                    >
                      <td className="py-2 px-3 font-mono text-[11px] text-neutral-600 border-r border-neutral-800/60 select-none">
                        {globalIdx}
                      </td>
                      {headers.map((_, cIdx) => {
                        const val = row[cIdx] ?? '';
                        const isNum = !isNaN(Number(val)) && val !== '';
                        return (
                          <td
                            key={cIdx}
                            className={`py-2 px-3 border-r border-neutral-800/60 truncate max-w-xs text-neutral-300 ${
                              isNum ? 'font-mono text-right tabular-nums text-neutral-200' : ''
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Pagination & Status Bar */}
      {viewFormat === 'table' && (
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-t border-neutral-800 text-xs text-neutral-400 font-mono tabular-nums">
          <div className="flex items-center gap-3">
            <span>总计 {filteredRows.length} 条记录</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>{headers.length} 个字段列</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
            >
              <option value={10}>10 行/页</option>
              <option value={20}>20 行/页</option>
              <option value={50}>50 行/页</option>
              <option value={100}>100 行/页</option>
            </select>

            <div className="flex items-center gap-1 font-sans">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-300 rounded text-xs"
              >
                上一页
              </button>
              <span className="px-2 font-mono text-neutral-300">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-300 rounded text-xs"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
