import { useState, useEffect, useMemo } from 'react'
import { driversClient } from '../api/client'
import type { Drivers } from '../generated/ryohi'

const DriversDataList = () => {
  const [driversList, setDriversList] = useState<Drivers[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ドライバーマスタデータ取得（本番DB）
  const fetchDriversData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await driversClient.list({
        limit: 500,
        offset: 0,
        orderBy: 'id ASC', // ID順でソート
      })
      setDriversList(response.response.items)
    } catch (err) {
      console.error('ドライバーマスタ取得エラー:', err)
      setError(err instanceof Error ? err.message : 'ドライバーマスタの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchDriversData()
  }, [])

  // 検索フィルター
  const filteredList = useMemo(() => {
    if (!searchTerm) return driversList

    const searchLower = searchTerm.toLowerCase()
    return driversList.filter(item =>
      item.id?.toString().includes(searchLower) ||
      item.name?.toLowerCase().includes(searchLower) ||
      item.shainR?.toLowerCase().includes(searchLower) ||
      item.bumon?.toLowerCase().includes(searchLower)
    )
  }, [driversList, searchTerm])

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 検索バー */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <input
              type="text"
              placeholder="検索... (ID, 氏名, 略称, 部門など)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={driversList.length === 0}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 件数表示 */}
        <div className="text-sm text-gray-600 bg-white px-4 py-3 rounded-xl border border-gray-200">
          {driversList.length > 0 ? (
            searchTerm ? (
              <>
                <span className="font-semibold text-purple-600">{filteredList.length}</span>
                <span className="text-gray-500"> / {driversList.length} 件</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-purple-600">{driversList.length}</span>
                <span className="text-gray-500"> 件</span>
              </>
            )
          ) : (
            <span className="text-gray-400">0 件</span>
          )}
        </div>

        {/* 取得ボタン */}
        <button
          onClick={fetchDriversData}
          disabled={loading}
          className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          title={loading ? '取得中...' : 'ドライバーマスタを取得'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-red-800 mb-1">エラーが発生しました</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 rounded-xl border border-purple-200">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-purple-700 font-medium">データを読み込んでいます...</span>
          </div>
        </div>
      )}

      {/* 空データ */}
      {!loading && driversList.length === 0 && !error && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600 font-medium mb-1">データがありません</p>
          <p className="text-gray-500 text-sm">
            「ドライバーマスタを取得」ボタンをクリックしてデータを読み込んでください
          </p>
        </div>
      )}

      {/* 検索結果なし */}
      {!loading && driversList.length > 0 && filteredList.length === 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6 text-center">
          <p className="text-yellow-800 font-medium mb-1">検索結果がありません</p>
          <p className="text-yellow-700 text-sm">
            検索条件「{searchTerm}」に一致するデータが見つかりませんでした
          </p>
        </div>
      )}

      {/* テーブル */}
      {!loading && filteredList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">氏名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">略称</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">部門</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">入社日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">退社日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">分類1</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">分類2</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`transition-all duration-150 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:shadow-sm ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono text-purple-700 font-semibold">{item.id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                      {item.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.shainR || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold">
                        {item.bumon || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.joinDate ? new Date(item.joinDate).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.retireDate ? new Date(item.retireDate).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.bunrui1 || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.bunrui2 || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriversDataList
