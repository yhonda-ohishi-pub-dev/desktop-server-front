import { useState } from 'react';
import { etcMeisaiClient, databaseClient } from '../api/client';
import type { ETCMeisai } from '../generated/ryohi';

export default function ETCMeisaiList() {
  const [etcList, setEtcList] = useState<ETCMeisai[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string>('未確認');

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
    </div>
  );
}
