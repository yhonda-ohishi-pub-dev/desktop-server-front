import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { etcMeisaiClient, databaseClient, downloadClient } from '../api/client';
import type { ETCMeisai } from '../generated/ryohi';
import type { ETCMeisaiListRef } from '../App';

const ETCMeisaiList = forwardRef<ETCMeisaiListRef, {}>((props, ref) => {
  const [etcList, setEtcList] = useState<ETCMeisai[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string>('未確認');
  const [downloading, setDownloading] = useState(false);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // デフォルト日付: 月初から今日まで（ローカルタイムゾーン）
  const getDefaultDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth()は0始まりなので+1
    const day = String(now.getDate()).padStart(2, '0');

    return {
      from: `${year}-${month}-01`,
      to: `${year}-${month}-${day}`
    };
  };

  const defaultDates = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaultDates.from);
  const [toDate, setToDate] = useState(defaultDates.to);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    loadAccountIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初回マウント時にETC明細を自動取得
  useEffect(() => {
    handleFetchETCMeisai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccountIds = async () => {
    try {
      console.log('🔍 アカウントIDを取得中...');
      const response = await downloadClient.getAllAccountIDs({});
      console.log('✅ アカウントID取得成功:', response.response);
      console.log('📋 取得したアカウント:', response.response.accountIds);

      if (response.response.accountIds && response.response.accountIds.length > 0) {
        setAccountIds(response.response.accountIds);
        setSelectedAccounts(response.response.accountIds); // デフォルトで全選択
        console.log(`✅ ${response.response.accountIds.length}個のアカウントを設定しました`);
      } else {
        console.warn('⚠️ アカウントIDが0件です。.envファイルを確認してください。');
      }
    } catch (err: any) {
      console.error('❌ アカウントID取得エラー:', err);
      console.error('エラー詳細:', {
        message: err?.message,
        code: err?.code,
        stack: err?.stack
      });
      // エラーの場合は空配列のまま
    }
  };

  const handleFetchETCMeisai = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('ETC明細を取得中...', {
        baseUrl: 'http://localhost:8080',
        grpcPath: '/ryohi.ETCMeisaiService/List',
        fullUrl: 'http://localhost:8080/ryohi.ETCMeisaiService/List',
        params: { limit: 20, offset: 0 },
        note: 'gRPC-Webはサービス名/メソッド名のパスを使用します'
      });

      const response = await etcMeisaiClient.list({
        limit: 1000,
        offset: 0
      });

      console.log('ETC明細取得成功:', response.response);
      setEtcList(response.response.items);
    } catch (err: any) {
      console.error('ETC明細取得エラー詳細:', {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        metadata: err?.metadata
      });

      let errorMessage = 'ETC明細の取得に失敗しました';

      if (err?.message) {
        errorMessage += `: ${err.message}`;
      }

      if (err?.code === 'NOT_FOUND' || err?.message?.includes('Not Found')) {
        errorMessage = 'サーバーのエンドポイントが見つかりません。desktop-serverが起動しているか、ETCMeisaiServiceが有効になっているか確認してください。';
      } else if (err?.message?.includes('fetch')) {
        errorMessage = 'サーバーに接続できません。http://localhost:8080 でdesktop-serverが起動しているか確認してください。';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkServerConnection = async () => {
    try {
      // gRPC-Webエンドポイントをテスト（実際にgRPCリクエストを送信）
      await databaseClient.getTables({});
      setServerStatus('✓ gRPC-Web接続OK');
    } catch (err: any) {
      console.error('接続テストエラー:', err);
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
        setServerStatus('✗ 接続失敗 - desktop-serverが起動しているか確認');
      } else if (err?.message?.includes('database not connected')) {
        // データベース未接続でもgRPC-Web自体は動作している
        setServerStatus('✓ gRPC-Web接続OK');
      } else {
        setServerStatus(`✗ エラー: ${err?.message || 'Unknown'}`);
      }
    }
  };

  const handleDownloadCSV = () => {
    if (etcList.length === 0) {
      alert('ダウンロードするデータがありません');
      return;
    }

    // CSVヘッダー
    const headers = ['ID', '利用日', '入口IC', '出口IC', '金額', '車種', 'ETC番号', 'ハッシュ'];

    // CSVデータ行
    const rows = etcList.map(item => [
      item.id,
      item.dateToDate,
      item.icFr,
      item.icTo,
      item.price,
      item.shashu,
      item.etcNum,
      item.hash
    ]);

    // CSVフォーマットに変換
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // BOMを追加してExcelで正しく開けるようにする
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    // ダウンロード
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    // ファイル名に日時を含める
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    link.setAttribute('download', `etc_meisai_${timestamp}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFromServer = async () => {
    if (!fromDate || !toDate) {
      alert('期間を指定してください');
      return;
    }

    // アカウント選択がない場合は空配列を送信
    // サーバー側（etc_meisai_scraper）が空配列の場合は.envから読み込む必要がある
    const accountsToUse = selectedAccounts.length > 0 ? selectedAccounts : [];

    setDownloading(true);
    setError(null);

    try {
      console.log('ETCデータをダウンロード中...', {
        accounts: accountsToUse.length > 0 ? accountsToUse : '(空配列 - サーバーが.envから読み込むべき)',
        fromDate,
        toDate,
        mode: 'db',
        note: accountsToUse.length === 0 ? 'アカウント指定なし（サーバー側で.envから自動取得が必要）' : ''
      });

      const startTime = Date.now();
      const response = await downloadClient.downloadSync({
        accounts: accountsToUse,
        fromDate,
        toDate,
        mode: 'db' // データベースに保存
      });
      const elapsed = Date.now() - startTime;

      // レスポンス詳細をコンソールに出力
      console.log('='.repeat(80));
      console.log('📊 ダウンロード完了レポート');
      console.log('='.repeat(80));
      console.log('⏱️  経過時間:', `${elapsed}ms`);
      console.log('✅ Success:', response.response.success);
      console.log('📝 Record Count:', response.response.recordCount);
      console.log('📁 CSV Path:', response.response.csvPath);
      console.log('❌ Error:', response.response.error || 'なし');
      console.log('📦 Full Response:', response.response);
      console.log('='.repeat(80));

      if (response.response.success) {
        const message = `ダウンロード完了: ${response.response.recordCount}件のレコードを取得しました\n経過時間: ${elapsed}ms`;
        alert(message);
        console.log('✅ ダウンロード成功:', message);
        setShowDownloadModal(false);
        // ダウンロード後、リストを再取得
        handleFetchETCMeisai();
      } else {
        const errorMsg = response.response.error || 'ダウンロードに失敗しました';
        console.error('❌ ダウンロード失敗:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('ダウンロードエラー:', err);
      console.error('エラー詳細:', {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        stack: err?.stack
      });

      let errorMsg = 'ダウンロードエラー: ';

      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
        errorMsg = 'desktop-serverに接続できません。http://localhost:8080 でサーバーが起動しているか確認してください。';
      } else if (err?.code === 'UNIMPLEMENTED') {
        errorMsg = 'DownloadServiceが実装されていません。desktop-serverを最新版に更新してください。';
      } else if (err?.code === 'UNAVAILABLE') {
        errorMsg = 'etc_meisai_scraperサービスに接続できません。desktop-serverのログを確認してください。';
      } else if (err?.code === 'UNKNOWN' && err?.message?.includes('EOF')) {
        errorMsg = 'リクエストの送信に失敗しました。ブラウザのコンソールログを確認してください。';
      } else {
        errorMsg += `${err?.message || 'Unknown'} (code: ${err?.code || 'N/A'})`;
      }

      setError(errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  // 検索フィルター
  const filteredList = useMemo(() => {
    if (!searchTerm) return etcList;

    const searchLower = searchTerm.toLowerCase();
    return etcList.filter(item =>
      item.id?.toString().includes(searchLower) ||
      item.dateToDate?.toLowerCase().includes(searchLower) ||
      item.icFr?.toLowerCase().includes(searchLower) ||
      item.icTo?.toLowerCase().includes(searchLower) ||
      item.shashu?.toLowerCase().includes(searchLower) ||
      item.etcNum?.toLowerCase().includes(searchLower)
    );
  }, [etcList, searchTerm]);

  // 親コンポーネントから呼び出せる関数を公開
  useImperativeHandle(ref, () => ({
    handleFetchETCMeisai,
    checkServerConnection,
    openDownloadModal: () => setShowDownloadModal(true),
    handleDownloadCSV
  }));

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 検索バー */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <input
              type="text"
              placeholder="検索... (ID, 利用日, 入口IC, 出口IC, ETC番号など)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={etcList.length === 0}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 件数表示 */}
        <div className="text-sm text-gray-600 bg-white px-4 py-3 rounded-xl border border-gray-200">
          {etcList.length > 0 ? (
            searchTerm ? (
              <>
                <span className="font-semibold text-blue-600">{filteredList.length}</span>
                <span className="text-gray-500"> / {etcList.length} 件</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-blue-600">{etcList.length}</span>
                <span className="text-gray-500"> 件</span>
              </>
            )
          ) : (
            <span className="text-gray-400">0 件</span>
          )}
        </div>

        {/* 取得ボタン */}
        <button
          onClick={handleFetchETCMeisai}
          disabled={loading}
          className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          title={loading ? '取得中...' : 'ETC明細を取得'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl shadow-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-lg">エラーが発生しました</p>
                <p className="text-red-700 text-sm mt-1.5 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* データテーブル */}
        {filteredList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">利用日</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">入口IC</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">出口IC</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-white">金額</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">車種</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">ETC番号</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">ハッシュ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredList.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`transition-all duration-150 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{item.dateToDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{item.icFr}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">{item.icTo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg font-bold text-sm shadow-sm">
                          ¥{item.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">{item.shashu}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono bg-gray-50 rounded">{item.etcNum}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                        <span className="px-2 py-1 bg-gray-100 rounded">{item.hash.substring(0, 12)}...</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* テーブルフッター統計 */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-700 font-medium">
                    表示件数: <span className="font-bold text-blue-600 text-lg">{filteredList.length}</span>件
                    {searchTerm && <span className="text-gray-500"> / {etcList.length}件</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-700 font-medium">
                    合計金額: <span className="font-bold text-green-600 text-lg">
                      ¥{filteredList.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 検索結果なし */}
        {!loading && etcList.length > 0 && filteredList.length === 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6 text-center">
            <p className="text-yellow-800 font-medium mb-1">検索結果がありません</p>
            <p className="text-yellow-700 text-sm">
              検索条件「{searchTerm}」に一致するデータが見つかりませんでした
            </p>
          </div>
        )}

        {/* 空状態 */}
        {!loading && etcList.length === 0 && !error && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-600 font-medium mb-1">データがありません</p>
            <p className="text-gray-500 text-sm">
              「ETC明細を取得」ボタンをクリックしてデータを読み込んでください
            </p>
          </div>
        )}

        {/* ローディング状態 */}
        {loading && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-700 font-medium">データを取得中...</p>
            </div>
          </div>
        )}

        {/* ダウンロードモーダル */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto transform transition-all">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">ETCデータ取得</h3>
                    <p className="text-sm text-gray-500 mt-0.5">サーバーから明細をダウンロード</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 期間選択 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    取得期間
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">開始日</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">終了日</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 説明 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900 mb-1">ETCデータ取得について</p>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        指定した期間のETCデータをサーバー経由でダウンロードし、データベースに保存します。アカウントは.envファイルから自動的に読み込まれます。
                      </p>
                    </div>
                  </div>
                </div>

                {/* アカウント選択 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    アカウント選択
                    <span className="ml-auto text-xs font-normal bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                      {selectedAccounts.length}/{accountIds.length}件選択中
                    </span>
                  </label>
                  <div className="border-2 border-gray-200 rounded-xl p-5 max-h-56 overflow-y-auto bg-gradient-to-br from-gray-50 to-slate-50 shadow-inner">
                    {accountIds.length === 0 ? (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          アカウントIDを自動取得できませんでした。<br />
                          空のまま実行すると、desktop-serverが.envから読み込みます。
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <label className="flex items-center space-x-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-purple-50 transition-colors border-2 border-purple-200 shadow-sm">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.length === accountIds.length && accountIds.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAccounts(accountIds);
                              } else {
                                setSelectedAccounts([]);
                              }
                            }}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="font-bold text-purple-900 flex-1">全て選択</span>
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </label>
                        {accountIds.map((accountId) => (
                          <label
                            key={accountId}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors border border-gray-200 hover:border-indigo-300"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAccounts.includes(accountId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAccounts([...selectedAccounts, accountId]);
                                } else {
                                  setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
                                }
                              }}
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="font-medium text-gray-700 flex-1">{accountId}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ボタン */}
                <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDownloadFromServer}
                    disabled={downloading || !fromDate || !toDate}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-bold flex items-center gap-2"
                    title={!fromDate || !toDate ? '期間を入力してください' : ''}
                  >
                    {downloading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        ダウンロード中...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        データ取得開始
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
});

ETCMeisaiList.displayName = 'ETCMeisaiList';

export default ETCMeisaiList;
