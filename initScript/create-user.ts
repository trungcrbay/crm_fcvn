import { DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Role } from '../src/modules/roles/role.entity';
import { User } from '../src/modules/users/user.entity';
import { UserStatus } from '../src/shared/constant/user.constant';
import { generateUserCode } from '../src/shared/utils';
import { Department } from '../src/modules/departments/department.entity';

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

const SALT_ROUNDS = 10;

const USERS_SEED_DATA = [
  {
    roleName: 'MASTER',
    email: 'admin@fcvn.vn',
    name: 'Admin Hệ Thống',
    phone: '0900000001',
    password: process.env.DB_ADMIN_PASSWORD_TEST || '123456',
    departmentCode: 'DEPT_IT',
  },
  {
    roleName: 'BOD',
    email: 'bod@fcvn.vn',
    name: 'Ban Giám Đốc (CEO)',
    phone: '0900000002',
    password: '123456',
    departmentCode: 'DEPT_IT',
  },
  {
    roleName: 'DEPARTMENT_MANAGER',
    email: 'manager.sales@fcvn.vn',
    name: 'Trưởng Phòng Sales',
    phone: '0900000003',
    password: '123456',
    departmentCode: 'DEPT_SALES',
  },
  {
    roleName: 'SALES',
    email: 'sales@fcvn.vn',
    name: 'Nhân Viên Sales',
    phone: '0900000004',
    password: process.env.DB_SALES_PASSWORD_TEST || '123456',
    departmentCode: 'DEPT_SALES',
  },
  {
    roleName: 'CSKH',
    email: 'cskh@fcvn.vn',
    name: 'Nhân Viên CSKH',
    phone: '0900000005',
    password: '123456',
    departmentCode: 'DEPT_CSKH',
  },
  {
    roleName: 'BOOKER',
    email: 'booker@fcvn.vn',
    name: 'Nhân Viên Booker',
    phone: '0900000006',
    password: '123456',
    departmentCode: 'DEPT_BOOKING',
  },
  {
    roleName: 'ACCOUNTING',
    email: 'accounting@fcvn.vn',
    name: 'Kế Toán Công Nợ',
    phone: '0900000007',
    password: '123456',
    departmentCode: 'DEPT_ACCOUNTING',
  },
  {
    roleName: 'MARKETING',
    email: 'marketing@fcvn.vn',
    name: 'Chuyên Viên Marketing',
    phone: '0900000008',
    password: '123456',
    departmentCode: 'DEPT_MARKETING',
  },
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'nestjs_crm',
  entities: [Role, User, Department],
  synchronize: false,
  logging: false,
});

async function seedUsers() {
  await dataSource.initialize();

  const roleRepository = dataSource.getRepository(Role);
  const departmentRepository = dataSource.getRepository(Department);
  const userRepository = dataSource.getRepository(User);

  for (const item of USERS_SEED_DATA) {
    const role = await roleRepository.findOne({
      where: { name: item.roleName },
    });

    const department = await departmentRepository.findOne({
      where: { departmentCode: item.departmentCode },
    });

    const existedUser = await userRepository.findOne({
      where: { email: item.email },
    });

    if (existedUser) {
      existedUser.name = item.name;
      existedUser.phone = item.phone;
      if (role) existedUser.roleId = role.id;
      if (department) existedUser.departmentId = department.id;
      await userRepository.save(existedUser);
      console.log(
        `Updated user: ${item.email} (Role: ${item.roleName}, Dept: ${item.departmentCode})`,
      );
      continue;
    }

    const hashedPassword = await hash(item.password, SALT_ROUNDS);

    const newUser = userRepository.create({
      name: item.name,
      email: item.email,
      phone: item.phone,
      password: hashedPassword,
      userCode: generateUserCode(),
      roleId: role?.id,
      departmentId: department?.id,
      status: UserStatus.ACTIVE,
    });

    await userRepository.save(newUser);
    console.log(
      `Created user: ${item.email} (Role: ${item.roleName}, Dept: ${item.departmentCode})`,
    );
  }

  await dataSource.destroy();
  console.log('Seed users completed successfully');
}

seedUsers().catch((error) => {
  console.error('Seed user failed:', error);
  process.exit(1);
});

// Từ root project -> run: npx ts-node initScript/create-user.ts
