import { Pencil, Trash2 } from "lucide-react";

const EntityTable = ({ columns, rows, renderCells, onEdit, onDelete, minWidth = "720px" }) => (
    <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
            <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                    {columns.map((column) => (
                        <th key={column.key} className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 ${column.className || ""}`}>
                            {column.label}
                        </th>
                    ))}
                    {(onEdit || onDelete) && <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">Actions</th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-indigo-50/30">
                        {renderCells(row)}
                        {(onEdit || onDelete) && (
                            <td className="px-5 py-4">
                                <div className="flex items-center justify-end gap-2">
                                    {onEdit && <button type="button" onClick={() => onEdit(row)} title="Edit" aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"><Pencil size={14} /></button>}
                                    {onDelete && <button type="button" onClick={() => onDelete(row)} title="Delete" aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>}
                                </div>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default EntityTable;
