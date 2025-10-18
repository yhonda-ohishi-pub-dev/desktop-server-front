interface QueryResult {
  columns: { [key: string]: string }
}

interface QueryResultsProps {
  results: QueryResult[]
}

export default function QueryResults({ results }: QueryResultsProps) {
  if (results.length === 0) {
    return null
  }

  const columns = Object.keys(results[0]?.columns || {})

  return (
    <div className="mt-4 bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Results ({results.length} rows)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.columns[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
