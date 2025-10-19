export default function DatabasePage() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">データ管理</h2>
        <p className="text-sm text-gray-500 mt-1">各種データの閲覧と管理</p>
      </div>

      {/* gRPCサービス一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 経費精算データ */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
              準備中
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">経費精算データ</h3>
          <p className="text-sm text-gray-600 mb-4">
            経費精算データの作成・取得・更新・削除
          </p>
          <div className="flex items-center text-xs text-purple-600 font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            DTakoUriageKeihiService
          </div>
        </div>

        {/* フェリー運行データ */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              準備中
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">フェリー運行データ</h3>
          <p className="text-sm text-gray-600 mb-4">
            フェリー運行データの作成・取得・更新・削除
          </p>
          <div className="flex items-center text-xs text-blue-600 font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            DTakoFerryRowsService
          </div>
        </div>

        {/* システム情報 */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-slate-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              準備中
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">システム情報</h3>
          <p className="text-sm text-gray-600 mb-4">
            サーバー状態とAPI接続情報の確認
          </p>
          <div className="flex items-center text-xs text-slate-600 font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            System Info
          </div>
        </div>
      </div>

      {/* 情報ボックス */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">gRPCサービスについて</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              上記のサービスは、desktop-serverで提供されているgRPC APIです。各カードをクリックすると、それぞれのデータ管理画面に移動します。現在は「準備中」となっていますが、順次実装予定です。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
