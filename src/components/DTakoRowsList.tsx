import { useState, useEffect, useMemo } from 'react'
import { dtakoRowsClient } from '../api/client'
import type { DTakoRows } from '../generated/ryohi'

const DTakoRowsList = () => {
  const [rowsList, setRowsList] = useState<DTakoRows[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 運行データ取得（本番DB）
  const fetchRowsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await dtakoRowsClient.list({
        limit: 100,
        offset: 0,
        orderBy: '読取日 DESC, 帰庫日時 DESC', // サーバー側でソート
      })
      setRowsList(response.response.items)
    } catch (err) {
      console.error('運行データ取得エラー:', err)
      setError(err instanceof Error ? err.message : '運行データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchRowsData()
  }, [])

  // 検索フィルター
  const filteredList = useMemo(() => {
    if (!searchTerm) return rowsList

    const searchLower = searchTerm.toLowerCase()
    return rowsList.filter(item =>
      item.id?.toLowerCase().includes(searchLower) ||
      item.operationNo?.toLowerCase().includes(searchLower) ||
      item.carCc?.toLowerCase().includes(searchLower) ||
      item.destinationCityName?.toLowerCase().includes(searchLower) ||
      item.destinationPlaceName?.toLowerCase().includes(searchLower)
    )
  }, [rowsList, searchTerm])

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 検索バー */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <input
              type="text"
              placeholder="検索... (運行NO, 車両, 目的地など)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              disabled={rowsList.length === 0}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 件数表示 */}
        <div className="text-sm text-gray-600 bg-white px-4 py-3 rounded-xl border border-gray-200">
          {rowsList.length > 0 ? (
            searchTerm ? (
              <>
                <span className="font-semibold text-green-600">{filteredList.length}</span>
                <span className="text-gray-500"> / {rowsList.length} 件</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-green-600">{rowsList.length}</span>
                <span className="text-gray-500"> 件</span>
              </>
            )
          ) : (
            <span className="text-gray-400">0 件</span>
          )}
        </div>

        {/* 取得ボタン */}
        <button
          onClick={fetchRowsData}
          disabled={loading}
          className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          title={loading ? '取得中...' : '運行データを取得'}
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
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 rounded-xl border border-green-200">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            <span className="text-green-700 font-medium">データを読み込んでいます...</span>
          </div>
        </div>
      )}

      {/* 空データ */}
      {!loading && rowsList.length === 0 && !error && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600 font-medium mb-1">データがありません</p>
          <p className="text-gray-500 text-sm">
            「運行データを取得」ボタンをクリックしてデータを読み込んでください
          </p>
        </div>
      )}

      {/* 検索結果なし */}
      {!loading && rowsList.length > 0 && filteredList.length === 0 && (
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
                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">読取日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">運行NO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">運行日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">車両</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">出庫時刻</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">帰庫時刻</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">総距離(km)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">実車距離(km)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">目的地</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`transition-all duration-150 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:shadow-sm ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.readDate ? new Date(item.readDate).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono text-green-700 font-semibold">{item.operationNo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.operationDate ? new Date(item.operationDate).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold">
                        {item.carCc}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.departureDatetime ? new Date(item.departureDatetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.returnDatetime ? new Date(item.returnDatetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-semibold text-green-700">
                        {item.totalDistance.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {item.loadedDistance ? item.loadedDistance.toFixed(1) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="max-w-[200px] truncate" title={`${item.destinationCityName || ''} ${item.destinationPlaceName || ''}`}>
                        {item.destinationCityName && item.destinationPlaceName
                          ? `${item.destinationCityName} ${item.destinationPlaceName}`
                          : item.destinationCityName || item.destinationPlaceName || '-'
                        }
                      </div>
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

export default DTakoRowsList
