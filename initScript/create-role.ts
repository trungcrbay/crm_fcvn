import { DataSource } from 'typeorm';
import { Role } from '../src/modules/roles/role.entity';
import { Permission } from '../src/shared/constant/permission.constant';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
const roleSeed = [
  {
    name: 'MASTER',
    description: 'Toàn quyền hệ thống',
    permissions: Object.values(Permission),
  },
  {
    name: 'BOD',
    description: 'Ban điều hành cấp cao',
    permissions: [
      Permission.USER_READ,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.USER_DELETE,
      Permission.USER_MANAGE,
      Permission.CUSTOMER_READ,
      Permission.CUSTOMER_CREATE,
      Permission.CUSTOMER_UPDATE,
      Permission.CUSTOMER_DELETE,
      Permission.CUSTOMER_MANAGE,
      Permission.DEPARTMENT_READ,
      Permission.DEPARTMENT_CREATE,
      Permission.DEPARTMENT_UPDATE,
      Permission.DEPARTMENT_DELETE,
      Permission.DEPARTMENT_MANAGE,
      Permission.FACILITY_READ,
      Permission.FACILITY_CREATE,
      Permission.FACILITY_UPDATE,
      Permission.FACILITY_DELETE,
      Permission.FACILITY_MANAGE,
      Permission.PERMISSION_READ,
      Permission.PERMISSION_CREATE,
      Permission.PERMISSION_UPDATE,
      Permission.PERMISSION_DELETE,
      Permission.PERMISSION_MANAGE,
    ],
  },
  {
    name: 'BRANCH_BOD',
    description: 'Ban điều hành chi nhánh',
    permissions: [
      Permission.USER_READ,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.CUSTOMER_READ,
      Permission.CUSTOMER_CREATE,
      Permission.CUSTOMER_UPDATE,
      Permission.CUSTOMER_DELETE,
      Permission.DEPARTMENT_READ,
      Permission.DEPARTMENT_CREATE,
      Permission.DEPARTMENT_UPDATE,
      Permission.DEPARTMENT_MANAGE,
      Permission.FACILITY_READ,
      Permission.FACILITY_CREATE,
      Permission.FACILITY_UPDATE,
      Permission.FACILITY_MANAGE,
    ],
  },
  {
    name: 'MANAGER',
    description: 'Quản lý bộ phận',
    permissions: [
      Permission.USER_READ,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.CUSTOMER_READ,
      Permission.CUSTOMER_CREATE,
      Permission.CUSTOMER_UPDATE,
      Permission.CUSTOMER_DELETE,
      Permission.DEPARTMENT_READ,
      Permission.DEPARTMENT_CREATE,
      Permission.DEPARTMENT_UPDATE,
      Permission.FACILITY_READ,
      Permission.FACILITY_CREATE,
      Permission.FACILITY_UPDATE,
    ],
  },
  {
    name: 'SALES',
    description: 'Sales vận hành bán hàng',
    permissions: [
      Permission.CUSTOMER_READ,
      Permission.DEPARTMENT_READ,
      Permission.FACILITY_READ,
    ],
  },
  {
    name: 'BOOKER',
    description: 'Booker đặt chỗ',
    permissions: [
      Permission.CUSTOMER_READ,
      Permission.CUSTOMER_CREATE,
      Permission.CUSTOMER_UPDATE,
      Permission.DEPARTMENT_READ,
      Permission.FACILITY_READ,
    ],
  },
  {
    name: 'ACCOUNTING',
    description: 'Tài chính kế toán',
    permissions: [
      Permission.USER_READ,
      Permission.CUSTOMER_READ,
      Permission.CUSTOMER_UPDATE,
      Permission.DEPARTMENT_READ,
      Permission.FACILITY_READ,
      Permission.PERMISSION_READ,
    ],
  },
  {
    name: 'HR',
    description: 'Nhân sự',
    permissions: [
      Permission.USER_READ,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.DEPARTMENT_READ,
      Permission.DEPARTMENT_CREATE,
      Permission.DEPARTMENT_UPDATE,
      Permission.FACILITY_READ,
      Permission.CUSTOMER_READ,
    ],
  },
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'test',
  entities: [Role],
  synchronize: false,
  logging: false,
});

async function seedRoles() {
  await dataSource.initialize();

  const roleRepository = dataSource.getRepository(Role);

  for (const item of roleSeed) {
    const existedRole = await roleRepository.findOne({
      where: { name: item.name },
    });

    if (existedRole) {
      existedRole.description = item.description;
      existedRole.permissions = item.permissions;
      await roleRepository.save(existedRole);
      console.log(`Updated role: ${item.name}`);
      continue;
    }

    const newRole = roleRepository.create({
      name: item.name,
      description: item.description,
      permissions: item.permissions,
    });

    await roleRepository.save(newRole);
    console.log(`Created role: ${item.name}`);
  }

  await dataSource.destroy();
  console.log('Seed role completed');
}

seedRoles().catch((error) => {
  console.error('Seed role failed:', error);
  process.exit(1);
});

// Từ root project -> run: npx ts-node initScript/create-role.ts
