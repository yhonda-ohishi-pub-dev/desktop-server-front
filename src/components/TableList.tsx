interface TableListProps {
  tables: string[]
  onTableClick: (table: string) => void
}

export default function TableList({ tables, onTableClick }: TableListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Tables</h2>
      <div className="space-y-1">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => onTableClick(table)}
            className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {table}
          </button>
        ))}
      </div>
    </div>
  )
}
