import ETCMeisaiList from './components/ETCMeisaiList'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold text-gray-800">ETC明細管理システム</h1>
          <p className="text-sm text-gray-600 mt-1">Desktop Server Frontend v1.3.0</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <ETCMeisaiList />
        </div>
      </div>
    </div>
  )
}

export default App
