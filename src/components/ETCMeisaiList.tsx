import { useState, useEffect } from 'react';
import { etcMeisaiClient, databaseClient, downloadClient } from '../api/client';
import type { ETCMeisai } from '../generated/ryohi';

export default function ETCMeisaiList() {
  const [etcList, setEtcList] = useState<ETCMeisai[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string>('未確認');
  const [downloading, setDownloading] = useState(false);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

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
        limit: 20,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ETC明細一覧</h2>
          <p className="text-sm text-gray-500 mt-1">高速道路利用履歴の確認</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={checkServerConnection}
            className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
          >
            接続テスト
          </button>
          <button
            onClick={handleFetchETCMeisai}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
          >
            {loading ? '取得中...' : 'ETC明細を取得 (20件)'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ETCデータ取得
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={etcList.length === 0}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV出力
          </button>
          <span className={`text-sm px-4 py-2 rounded-lg ${
            serverStatus.includes('✓')
              ? 'bg-green-100 text-green-700 border border-green-300'
              : serverStatus.includes('✗')
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}>
            {serverStatus}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <span className="text-lg mr-2">⚠️</span>
            <div>
              <p className="font-semibold">エラーが発生しました</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {etcList.length > 0 && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">利用日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">入口IC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">出口IC</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">金額</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">車種</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ETC番号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ハッシュ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {etcList.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.dateToDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.icFr}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.icTo}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">{item.price.toLocaleString()}円</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.shashu}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">{item.etcNum}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">{item.hash.substring(0, 12)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-2">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{etcList.length}</span>件のデータを表示中
            </p>
            <p className="text-xs text-gray-500">
              合計金額: <span className="font-semibold text-blue-600">
                {etcList.reduce((sum, item) => sum + item.price, 0).toLocaleString()}円
              </span>
            </p>
          </div>
        </div>
      )}

      {!loading && etcList.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium">データがありません</p>
          <p className="text-gray-500 text-sm mt-2">「ETC明細を取得」ボタンをクリックしてデータを読み込んでください</p>
        </div>
      )}

      {/* ダウンロードモーダル */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">ETCデータ取得</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 期間選択 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 説明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">ETCデータ取得について</p>
                    <p className="text-sm text-blue-700 mt-1">指定した期間のETCデータをサーバー経由でダウンロードし、データベースに保存します。アカウントは.envファイルから自動的に読み込まれます。</p>
                  </div>
                </div>
              </div>

              {/* アカウント選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アカウント選択 ({selectedAccounts.length}/{accountIds.length}件選択中)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {accountIds.length === 0 ? (
                    <p className="text-sm text-gray-500">アカウントIDを自動取得できませんでした。空のまま実行すると、desktop-serverが.envから読み込みます。</p>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
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
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="font-semibold">全て選択</span>
                      </label>
                      {accountIds.map((accountId) => (
                        <label key={accountId} className="flex items-center space-x-2 cursor-pointer">
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
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span>{accountId}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDownloadFromServer}
                  disabled={downloading || !fromDate || !toDate}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  title={!fromDate || !toDate ? '期間を入力してください' : ''}
                >
                  {downloading ? 'ダウンロード中...' : 'データ取得開始'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
