import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const scripts = [
  'create-role.ts',
  'create-department.ts',
  'create-user.ts',
  'create-customer.ts',
];

console.log('=== BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU TOÀN BỘ HỆ THỐNG ===\n');

for (const script of scripts) {
  const scriptPath = resolve(__dirname, script);
  console.log(`\n---> [SEED] Đang chạy: ${script}...`);

  const result = spawnSync('npx', ['ts-node', scriptPath], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.status !== 0) {
    console.error(`\n❌ Lỗi khi thực thi ${script}. Dừng quá trình seed.`);
    process.exit(1);
  }
}

console.log('\n=== ✅ HOÀN TẤT SEED DỮ LIỆU TOÀN BỘ HỆ THỐNG THÀNH CÔNG ===\n');
