import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const protoFiles = [
  'proto/database.proto',
  'proto/ryohi.proto',
  'proto/download.proto',
  'proto/download_buffer.proto'
];

// Node.jsでprotoc-gen-tsを実行するためのラッパー
const pluginScript = join(rootDir, 'node_modules', '@protobuf-ts', 'plugin', 'bin', 'protoc-gen-ts');

// Windowsではnodeコマンドでスクリプトを実行
const args = [
  `--plugin=protoc-gen-ts=node ${pluginScript}`,
  '--ts_opt=generate_dependencies,client_grpc1',
  '--ts_out=src/generated',
  '--proto_path=proto',
  ...protoFiles
];

console.log('Generating TypeScript from proto files...');

const protoc = spawn('protoc', args, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

protoc.on('close', (code) => {
  if (code === 0) {
    console.log('✓ Proto files compiled successfully!');
  } else {
    console.error('✗ Failed to compile proto files');
    process.exit(code);
  }
});
