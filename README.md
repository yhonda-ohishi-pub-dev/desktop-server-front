# Desktop Server - Frontend

データベース管理用デスクトップアプリケーション「Desktop Server」のWebフロントエンド。React + TypeScript + Viteで構築され、gRPC-Webを使用してバックエンドと通信します。

## 技術スタック

- **React 19** - UIフレームワーク
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **TailwindCSS** - ユーティリティファーストCSS
- **gRPC-Web** - バックエンドとの通信（Protocol Buffers）
- **@protobuf-ts** - TypeScript用Protocol Buffersライブラリ

## 主な機能

### Database Service
- データベーステーブル一覧表示
- SQLクエリエディタ
- クエリ結果のテーブル表示
- リアルタイムクエリ実行

### Ryohi Services (db_service)
- ETC明細管理 (`/api/v1/db/etc-meisai`)
- 経費精算管理 (`/api/v1/db/dtako-uriage-keihi`)
- フェリー運行管理 (`/api/v1/db/dtako-ferry-rows`)
- ETC明細マッピング (`/api/v1/db/etc-meisai-mapping`)

### Download Services (etc_meisai_scraper)
- ETC明細ダウンロード（同期/非同期）
- ストリーミングダウンロード
- アカウント管理

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### Protocol Buffersの生成

protoファイルからTypeScriptコードを生成：

```bash
npm run proto
# または
cmd /c generate-proto.bat
```

これにより、以下のprotoファイルからTypeScriptクライアントが生成されます：
- `proto/database.proto` - DatabaseService
- `proto/ryohi.proto` - ETCMeisai, DTakoUriageKeihi, DTakoFerryRows, ETCMeisaiMapping
- `proto/download.proto` - DownloadService
- `proto/download_buffer.proto` - DownloadBufferService

生成されたファイルは `src/generated/` に出力されます。

### 開発サーバーの起動

```bash
npm run dev
```

開発サーバーは `http://localhost:5173` で起動します。

### ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

## バックエンドとの統合

### バックエンドへのデプロイ

フロントエンドをビルドしてバックエンドプロジェクトにコピー：

```bash
npm run build:backend
```

このコマンドは以下を実行します：
1. フロントエンドをビルド（`dist/` に出力）
2. ビルド成果物を `../desktop-server/desktop-sv/dist/` にコピー

### 手動統合

```bash
# フロントエンドをビルド
npm run build

# バックエンドプロジェクトにコピー
cp -r dist/* ../desktop-server/desktop-sv/dist/
```

## CI/CD

### GitHub Actions

プッシュ時に自動的にフロントエンドをビルドし、成果物をアーティファクトとして保存します。

- **ビルドワークフロー** (`.github/workflows/build.yml`)
  - `main`/`master` ブランチへのプッシュ/PRで実行
  - ビルド成果物を30日間保持

- **リリースワークフロー** (`.github/workflows/release.yml`)
  - GitHubリリース作成時に実行
  - ビルド成果物をtar.gzで圧縮してリリースに添付

### リリースの作成

```bash
# タグを作成
git tag v1.0.0
git push origin v1.0.0

# GitHubでリリースを作成
# GitHub Actionsが自動的にビルドしてアーティファクトを添付
```

## バックエンドサーバーとの接続

バックエンドサーバーは `http://localhost:8080` で動作することを想定しています。

変更する場合は [src/api/client.ts](src/api/client.ts) の `baseUrl` を修正してください：

```typescript
const transport = new GrpcWebFetchTransport({
  baseUrl: "http://localhost:8080",  // ← ここを変更
});
```

## プロジェクト構成

```
desktop-server-front/
├── .github/
│   └── workflows/              # GitHub Actions ワークフロー
│       ├── build.yml           # ビルドワークフロー
│       └── release.yml         # リリースワークフロー
├── proto/
│   ├── database.proto          # DatabaseService定義
│   ├── ryohi.proto             # Ryohiサービス定義 (db_service)
│   ├── download.proto          # DownloadService定義
│   ├── download_buffer.proto   # DownloadBufferService定義
│   └── google/                 # Google Protocol Buffers依存関係
│       ├── api/
│       │   ├── annotations.proto
│       │   └── http.proto
│       └── protobuf/
│           └── timestamp.proto
├── scripts/
│   ├── copy-to-backend.js      # バックエンドコピースクリプト
│   └── generate-proto.js       # Proto生成スクリプト (Node.js)
├── src/
│   ├── api/
│   │   └── client.ts           # gRPC-Webクライアント (全サービス)
│   ├── components/
│   │   ├── QueryResults.tsx
│   │   ├── SqlEditor.tsx
│   │   └── TableList.tsx
│   ├── generated/              # 自動生成されたProtoBufコード
│   │   ├── database.ts
│   │   ├── database.client.ts
│   │   ├── ryohi.ts
│   │   ├── ryohi.client.ts
│   │   ├── download.ts
│   │   ├── download.client.ts
│   │   ├── download_buffer.ts
│   │   └── download_buffer.client.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── generate-proto.bat          # Proto生成スクリプト (Windows)
├── protoc-gen-ts.bat           # protoc-genラッパー (Windows)
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
