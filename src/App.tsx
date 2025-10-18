import { useState, useEffect } from 'react'
import { databaseClient } from './api/client'
import SqlEditor from './components/SqlEditor'
import TableList from './components/TableList'
import QueryResults from './components/QueryResults'
import ETCMeisaiList from './components/ETCMeisaiList'

interface QueryResult {
  columns: { [key: string]: string }
}

function App() {
  const [tables, setTables] = useState<string[]>([])
  const [sql, setSql] = useState('SELECT * FROM ')
  const [results, setResults] = useState<QueryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      const response = await databaseClient.getTables({})
      setTables(response.response.tables)
    } catch (err) {
      setError(`Failed to load tables: ${err}`)
    }
  }

  const executeQuery = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await databaseClient.queryDatabase({ sql, params: [] })
      setResults(response.response.rows.map(row => ({ columns: row.columns })))
    } catch (err) {
      setError(`Query failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Desktop Database Manager</h1>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        {/* ETC明細テスト用 */}
        <div className="bg-white rounded-lg shadow p-6">
          <ETCMeisaiList />
        </div>

        {/* 既存のデータベースクエリ機能 */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <TableList tables={tables} onTableClick={(table: string) => setSql(`SELECT * FROM ${table}`)} />
          </div>

          <div className="col-span-9">
            <SqlEditor
              sql={sql}
              onSqlChange={setSql}
              onExecute={executeQuery}
              loading={loading}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <QueryResults results={results} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
