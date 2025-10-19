import { useState, useEffect, useMemo } from 'react'
import { dtakoEventsClient } from '../api/client'
import type { DTakoEvents } from '../generated/ryohi'

const DTakoEventsList = () => {
  const [eventsList, setEventsList] = useState<DTakoEvents[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // イベント情報取得（本番DB）
  const fetchEventsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await dtakoEventsClient.list({
        limit: 1000,
        offset: 0,
        orderBy: '開始日時 DESC', // サーバー側でソート
      })
      setEventsList(response.response.items)
    } catch (err) {
      console.error('イベント情報取得エラー:', err)
      setError(err instanceof Error ? err.message : 'イベント情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchEventsData()
  }, [])

  // 検索フィルター
  const filteredList = useMemo(() => {
    if (!searchTerm) return eventsList

    const searchLower = searchTerm.toLowerCase()
    return eventsList.filter(item =>
      item.operationNo?.toLowerCase().includes(searchLower) ||
      item.carCc?.toLowerCase().includes(searchLower) ||
      item.eventName?.toLowerCase().includes(searchLower) ||
      item.startCityName?.toLowerCase().includes(searchLower) ||
      item.endCityName?.toLowerCase().includes(searchLower)
    )
  }, [eventsList, searchTerm])

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 検索バー */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <input
              type="text"
              placeholder="検索... (運行NO, 車両, イベント名, 都市名など)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              disabled={eventsList.length === 0}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 件数表示 */}
        <div className="text-sm text-gray-600 bg-white px-4 py-3 rounded-xl border border-gray-200">
          {eventsList.length > 0 ? (
            searchTerm ? (
              <>
                <span className="font-semibold text-orange-600">{filteredList.length}</span>
                <span className="text-gray-500"> / {eventsList.length} 件</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-orange-600">{eventsList.length}</span>
                <span className="text-gray-500"> 件</span>
              </>
            )
          ) : (
            <span className="text-gray-400">0 件</span>
          )}
        </div>

        {/* 取得ボタン */}
        <button
          onClick={fetchEventsData}
          disabled={loading}
          className="p-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          title={loading ? '取得中...' : 'イベント情報を取得'}
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
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 rounded-xl border border-orange-200">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
            <span className="text-orange-700 font-medium">データを読み込んでいます...</span>
          </div>
        </div>
      )}

      {/* 空データ */}
      {!loading && eventsList.length === 0 && !error && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600 font-medium mb-1">データがありません</p>
          <p className="text-gray-500 text-sm">
            「イベント情報を取得」ボタンをクリックしてデータを読み込んでください
          </p>
        </div>
      )}

      {/* 検索結果なし */}
      {!loading && eventsList.length > 0 && filteredList.length === 0 && (
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
                <tr className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">運行NO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">読取日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">車両</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">イベント名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">開始時刻</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">終了時刻</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">開始地点</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">終了地点</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">区間距離(km)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">区間時間(分)</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`transition-all duration-150 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:shadow-sm ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono text-orange-700 font-semibold">{item.operationNo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.readDate ? new Date(item.readDate).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold">
                        {item.carCc}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-semibold">
                        {item.eventName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.startDatetime ? new Date(item.startDatetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.endDatetime ? new Date(item.endDatetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.startCityName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.endCityName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-semibold text-orange-700">
                        {item.sectionDistance.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {Math.round(item.sectionTime / 60)}
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

export default DTakoEventsList
