import { DataSource, Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Role } from '../src/modules/roles/role.entity';
import { User } from '../src/modules/users/user.entity';
import { Permission } from '../src/shared/constant/permission.constant';
import { UserStatus } from '../src/shared/constant/user.constant';
import { generateUserCode } from '../src/shared/utils';

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

const ADMIN = {
  role: 'MASTER',
  email: 'admin@fcvn.vn',
  password: process.env.DB_ADMIN_PASSWORD_TEST as string,
  name: 'Admin hệ thống',
  phone: '0900000001',
};

const SALES = {
  role: 'SALES',
  email: 'sales@fcvn.vn',
  password: process.env.DB_SALES_PASSWORD_TEST as string,
  name: 'Nhân viên Sales',
  phone: '0900000002',
};

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'nestjs_crm',
  entities: [Role, User],
  synchronize: false,
  logging: false,
});

async function createRole(
  roleRepository: Repository<Role>,
  name: string,
  permissions: Permission[],
  description: string,
): Promise<Role> {
  const existed = await roleRepository.findOne({ where: { name } });

  if (existed) {
    console.log(`Role existed: ${name}`);

    return existed;
  }

  const role = roleRepository.create({ name, description, permissions });

  await roleRepository.save(role);
  console.log(`Created role: ${name}`);

  return role;
}

async function createUser(
  userRepository: Repository<User>,
  data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    roleId: string | number;
  },
): Promise<User> {
  const existed = await userRepository.findOne({
    where: { email: data.email },
  });

  if (existed) {
    console.log(`User existed (skip): ${data.email}`);

    return existed;
  }

  const hashedPassword = await hash(data.password, SALT_ROUNDS);

  const user = userRepository.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    userCode: generateUserCode(),
    roleId: Number(data.roleId),
    status: UserStatus.ACTIVE,
  });

  await userRepository.save(user);
  console.log(`Created user: ${data.email}`);

  return user;
}

async function seedUsers() {
  await dataSource.initialize();

  const roleRepository = dataSource.getRepository(Role);
  const userRepository = dataSource.getRepository(User);

  const masterRole = await createRole(
    roleRepository,
    ADMIN.role,
    Object.values(Permission),
    'Toàn quyền hệ thống',
  );

  const salesRole = await createRole(
    roleRepository,
    SALES.role,
    [
      Permission.CUSTOMER_READ,
      Permission.DEPARTMENT_READ,
      Permission.FACILITY_READ,
    ],
    'Sales vận hành bán hàng',
  );

  await createUser(userRepository, { ...ADMIN, roleId: masterRole.id });

  await createUser(userRepository, { ...SALES, roleId: salesRole.id });

  await dataSource.destroy();
}

seedUsers().catch((error) => {
  console.error('Seed user failed:', error);
  process.exit(1);
});

// Từ root project -> run: npx ts-node initScript/create-user.ts
