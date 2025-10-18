interface SqlEditorProps {
  sql: string
  onSqlChange: (sql: string) => void
  onExecute: () => void
  loading: boolean
}

export default function SqlEditor({ sql, onSqlChange, onExecute, loading }: SqlEditorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">SQL Editor</h2>
      <textarea
        value={sql}
        onChange={(e) => onSqlChange(e.target.value)}
        className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter SQL query..."
      />
      <button
        onClick={onExecute}
        disabled={loading}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Executing...' : 'Execute Query'}
      </button>
    </div>
  )
}
