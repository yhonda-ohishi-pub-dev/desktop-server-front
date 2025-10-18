import { useState } from 'react';
import { etcMeisaiClient } from '../api/client';
import type { ETCMeisai } from '../generated/ryohi';

export default function ETCMeisaiList() {
  const [etcList, setEtcList] = useState<ETCMeisai[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchETCMeisai = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await etcMeisaiClient.list({
        limit: 20,
        offset: 0
      });

      setEtcList(response.response.items);
      console.log('ETC明細取得成功:', response.response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ETC明細の取得に失敗しました';
      setError(errorMessage);
      console.error('ETC明細取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">ETC明細一覧</h2>
        <button
          onClick={handleFetchETCMeisai}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '取得中...' : 'ETC明細を取得 (20件)'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          エラー: {error}
        </div>
      )}

      {etcList.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">利用日</th>
                <th className="px-4 py-2 border">入口IC</th>
                <th className="px-4 py-2 border">出口IC</th>
                <th className="px-4 py-2 border">金額</th>
                <th className="px-4 py-2 border">車種</th>
                <th className="px-4 py-2 border">ETC番号</th>
                <th className="px-4 py-2 border">ハッシュ</th>
              </tr>
            </thead>
            <tbody>
              {etcList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{item.id}</td>
                  <td className="px-4 py-2 border">{item.dateToDate}</td>
                  <td className="px-4 py-2 border">{item.icFr}</td>
                  <td className="px-4 py-2 border">{item.icTo}</td>
                  <td className="px-4 py-2 border text-right">{item.price.toLocaleString()}円</td>
                  <td className="px-4 py-2 border">{item.shashu}</td>
                  <td className="px-4 py-2 border">{item.etcNum}</td>
                  <td className="px-4 py-2 border text-xs text-gray-500">{item.hash.substring(0, 12)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-sm text-gray-600">
            {etcList.length}件表示
          </div>
        </div>
      )}

      {!loading && etcList.length === 0 && !error && (
        <div className="text-center text-gray-500 py-8">
          ボタンをクリックしてETC明細を取得してください
        </div>
      )}
    </div>
  );
}
