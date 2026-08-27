import { DataSource } from 'typeorm';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Department } from '../src/modules/departments/department.entity';
import { DepartmentStatus } from '../src/shared/constant/department.constant';
import { User } from '../src/modules/users/user.entity';
import { Role } from '../src/modules/roles/role.entity';

const loadEnvFile = () => {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const envFile = readFileSync(envPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    process.env[key] ??= value;
  }
};

loadEnvFile();

const departmentsSeed = [
  {
    departmentCode: 'DEPT_SALES',
    name: 'Phòng Kinh Doanh',
    description:
      'Phụ trách bán hàng, quản lý quan hệ khách hàng và mở rộng thị trường',
    status: DepartmentStatus.ACTIVE,
  },
  {
    departmentCode: 'DEPT_BOOKING',
    name: 'Phòng Điều Hành & Booker',
    description: 'Phụ trách đặt dịch vụ, book vé, khách sạn và điều phối tour',
    status: DepartmentStatus.ACTIVE,
  },
  {
    departmentCode: 'DEPT_ACCOUNTING',
    name: 'Phòng Tài Chính - Kế Toán',
    description:
      'Quản lý thu chi, công nợ, duyệt thanh toán và báo cáo tài chính',
    status: DepartmentStatus.ACTIVE,
  },
  {
    departmentCode: 'DEPT_CSKH',
    name: 'Phòng Chăm Sóc Khách Hàng',
    description: 'Tiếp nhận xử lý khiếu nại, chăm sóc sau bán và hỗ trợ sự cố',
    status: DepartmentStatus.ACTIVE,
  },
  {
    departmentCode: 'DEPT_MARKETING',
    name: 'Phòng Marketing',
    description: 'Quản lý nguồn lead, truyền thông và phát triển thương hiệu',
    status: DepartmentStatus.ACTIVE,
  },
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'nestjs_crm',
  entities: [Department, User, Role],
  synchronize: false,
  logging: false,
});

async function seedDepartments() {
  await dataSource.initialize();

  const departmentRepository = dataSource.getRepository(Department);

  for (const item of departmentsSeed) {
    const existed = await departmentRepository.findOne({
      where: { departmentCode: item.departmentCode },
    });

    if (existed) {
      existed.name = item.name;
      existed.description = item.description;
      existed.status = item.status;
      await departmentRepository.save(existed);
      console.log(`Updated department: ${item.name} (${item.departmentCode})`);
      continue;
    }

    const newDept = departmentRepository.create(item);
    await departmentRepository.save(newDept);
    console.log(`Created department: ${item.name} (${item.departmentCode})`);
  }

  await dataSource.destroy();
  console.log('Seed departments completed successfully');
}

seedDepartments().catch((error) => {
  console.error('Seed departments failed:', error);
  process.exit(1);
});

// Chạy: npx ts-node initScript/create-department.ts
