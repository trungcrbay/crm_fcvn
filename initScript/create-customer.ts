import { DataSource } from 'typeorm';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Customer } from '../src/modules/customers/customer.entity';
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

const TOTAL_CUSTOMERS = 10_000;
const BATCH_SIZE = 500;

const CREATED_BY_ID = 2;

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'nestjs_crm',
  entities: [Customer, User, Role],
  synchronize: false,
  logging: false,
});

const firstNames = [
  'Nguyễn Văn',
  'Trần Văn',
  'Lê Văn',
  'Phạm Văn',
  'Hoàng Văn',
  'Vũ Văn',
  'Đặng Văn',
  'Bùi Văn',
  'Đỗ Văn',
  'Ngô Văn',
];

const lastNames = [
  'An',
  'Bình',
  'Cường',
  'Dũng',
  'Hùng',
  'Khang',
  'Long',
  'Minh',
  'Nam',
  'Phúc',
  'Quân',
  'Sơn',
  'Thành',
  'Tuấn',
  'Vinh',
];

const cities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

const randomItem = <T>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const generateCustomerCode = (index: number): string => {
  return `CUS${String(index).padStart(6, '0')}`;
};

const generateCustomer = (index: number): Partial<Customer> => {
  const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
  const customerCode = generateCustomerCode(index);

  return {
    customerCode,
    name,
    email: `customer${index}@example.com`,
    phone: `09${String(10000000 + index).slice(-8)}`,
    address: `${Math.floor(Math.random() * 200) + 1} Đường ${randomItem([
      'Láng',
      'Nguyễn Trãi',
      'Cầu Giấy',
      'Trần Duy Hưng',
      'Hoàng Quốc Việt',
    ])}, ${randomItem(cities)}`,
    createdById: CREATED_BY_ID,
  };
};

async function seedCustomers() {
  await dataSource.initialize();

  const customerRepository = dataSource.getRepository(Customer);

  const startedAt = Date.now();

  try {
    for (let start = 1; start <= TOTAL_CUSTOMERS; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE - 1, TOTAL_CUSTOMERS);

      const customers: Partial<Customer>[] = [];

      for (let index = start; index <= end; index++) {
        customers.push(generateCustomer(index));
      }

      await customerRepository.insert(customers);

      const created = end;

      console.log(
        `Created ${created}/${TOTAL_CUSTOMERS} customers (${(
          (created / TOTAL_CUSTOMERS) *
          100
        ).toFixed(1)}%)`,
      );
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);

    console.log(`Successfully created ${TOTAL_CUSTOMERS} customers.`);
    console.log(`Time: ${elapsed}s`);
  } catch (error) {
    console.error('Seed customers failed:', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

seedCustomers();
