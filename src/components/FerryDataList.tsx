import { useState, useEffect, useMemo } from 'react'
import { dtakoFerryRowsProdClient } from '../api/client'
import type { DTakoFerryRows } from '../generated/ryohi'

const FerryDataList = () => {
  const [ferryList, setFerryList] = useState<DTakoFerryRows[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // フェリー運行データ取得（本番DB - 9,007件）
  const fetchFerryData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await dtakoFerryRowsProdClient.list({
        limit: 1000,
        offset: 0,
      })
      setFerryList(response.response.items)
    } catch (err) {
      console.error('フェリー運行データ取得エラー:', err)
      setError(err instanceof Error ? err.message : 'フェリー運行データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchFerryData()
  }, [])

  // 検索フィルター
  const filteredList = useMemo(() => {
    if (!searchTerm) return ferryList

    const searchLower = searchTerm.toLowerCase()
    return ferryList.filter(item =>
      item.unkoNo?.toLowerCase().includes(searchLower) ||
      item.jigyoshoName?.toLowerCase().includes(searchLower) ||
      item.sharyoName?.toLowerCase().includes(searchLower) ||
      item.jomuinName1?.toLowerCase().includes(searchLower) ||
      item.ferryCompanyName?.toLowerCase().includes(searchLower) ||
      item.noribaName?.toLowerCase().includes(searchLower) ||
      item.oribaName?.toLowerCase().includes(searchLower)
    )
  }, [ferryList, searchTerm])

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 検索バー */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <input
              type="text"
              placeholder="検索... (運行NO, 事業所, 車両, 乗務員, フェリー会社など)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={ferryList.length === 0}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 件数表示 */}
        <div className="text-sm text-gray-600 bg-white px-4 py-3 rounded-xl border border-gray-200">
          {ferryList.length > 0 ? (
            searchTerm ? (
              <>
                <span className="font-semibold text-blue-600">{filteredList.length}</span>
                <span className="text-gray-500"> / {ferryList.length} 件</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-blue-600">{ferryList.length}</span>
                <span className="text-gray-500"> 件</span>
              </>
            )
          ) : (
            <span className="text-gray-400">0 件</span>
          )}
        </div>

        {/* 取得ボタン */}
        <button
          onClick={fetchFerryData}
          disabled={loading}
          className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          title={loading ? '取得中...' : 'フェリー運行データを取得'}
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
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 rounded-xl border border-blue-200">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">データを読み込んでいます...</span>
          </div>
        </div>
      )}

      {/* 空データ */}
      {!loading && ferryList.length === 0 && !error && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600 font-medium mb-1">データがありません</p>
          <p className="text-gray-500 text-sm">
            「フェリー運行データを取得」ボタンをクリックしてデータを読み込んでください
          </p>
        </div>
      )}

      {/* 検索結果なし */}
      {!loading && ferryList.length > 0 && filteredList.length === 0 && (
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
                <tr className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">運行NO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">運行日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">事業所</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">車両</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">乗務員</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">フェリー会社</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">乗場</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">降場</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">便</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">標準料金</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">契約料金</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">見なし距離</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`transition-all duration-150 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-sm ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono text-blue-700 font-semibold">{item.unkoNo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.unkoDate || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-[150px] truncate" title={item.jigyoshoName}>
                        {item.jigyoshoName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-[120px] truncate" title={item.sharyoName}>
                        {item.sharyoName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-[120px] truncate" title={item.jomuinName1}>
                        {item.jomuinName1}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-[150px] truncate" title={item.ferryCompanyName}>
                        {item.ferryCompanyName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-semibold">
                        {item.noribaName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-semibold">
                        {item.oribaName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-semibold">
                        {item.bin}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      ¥{item.hyojunRyokin.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-semibold text-cyan-700">
                        ¥{item.keiyakuRyokin.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {item.minashiKyori.toLocaleString()} km
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

export default FerryDataList
