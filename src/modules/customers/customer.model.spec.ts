import { CreateCustomerBodySchema } from './customer.model';
import {
  CustomerStatus,
  CustomerType,
  GroupType,
} from 'src/shared/constant/customer.constant';

describe('CreateCustomerBodySchema Validation', () => {
  const validBasePayload = {
    customerCode: 'CUS-001',
    name: 'Công ty Cổ phần ABC',
    email: 'abc@example.com',
    phone: '0901234567',
    customerType: CustomerType.INDIVIDUAL,
    groupType: GroupType.NORMAL,
    status: CustomerStatus.ACTIVE,
    identityNumber: '001234567890',
  };

  it('should accept a valid customer payload', () => {
    const result = CreateCustomerBodySchema.safeParse(validBasePayload);
    expect(result.success).toBe(true);
  });

  describe('Tiêu chí 2: Chặn thiếu tên, SĐT sai 10-11 số, email sai, nhóm ngoài VIP/Normal/Other', () => {
    it('should reject missing or empty name', () => {
      const payloadWithoutName = { ...validBasePayload, name: '' };
      const result = CreateCustomerBodySchema.safeParse(payloadWithoutName);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((i) =>
          i.path.includes('name'),
        );
        expect(nameError).toBeDefined();
      }
    });

    it('should reject invalid phone number formats', () => {
      const invalidPhones = [
        '123456',
        '0901234',
        '090123456789123',
        'abc0901234',
        '012345678',
      ];
      for (const phone of invalidPhones) {
        const result = CreateCustomerBodySchema.safeParse({
          ...validBasePayload,
          phone,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const phoneError = result.error.issues.find((i) =>
            i.path.includes('phone'),
          );
          expect(phoneError?.message).toBe('Số điện thoại không hợp lệ');
        }
      }
    });

    it('should accept valid 10-11 digit Vietnamese phone numbers', () => {
      const validPhones = [
        '0901234567',
        '+84901234567',
        '84901234567',
        '02431234567',
      ];
      for (const phone of validPhones) {
        const result = CreateCustomerBodySchema.safeParse({
          ...validBasePayload,
          phone,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingusername.com',
        'username@.com',
      ];
      for (const email of invalidEmails) {
        const result = CreateCustomerBodySchema.safeParse({
          ...validBasePayload,
          email,
        });
        expect(result.success).toBe(false);
      }
    });

    it('should reject groupType outside VIP/Normal/Other', () => {
      const result = CreateCustomerBodySchema.safeParse({
        ...validBasePayload,
        groupType: 'SUPER_VIP' as any,
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid groupTypes (vip, normal, other)', () => {
      for (const groupType of [
        GroupType.VIP,
        GroupType.NORMAL,
        GroupType.OTHER,
      ]) {
        const result = CreateCustomerBodySchema.safeParse({
          ...validBasePayload,
          groupType,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Ràng buộc theo loại khách hàng (customerType)', () => {
    it('should require identityNumber for INDIVIDUAL customerType', () => {
      const payload = {
        ...validBasePayload,
        customerType: CustomerType.INDIVIDUAL,
        identityNumber: null,
      };
      const result = CreateCustomerBodySchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) =>
          i.path.includes('identityNumber'),
        );
        expect(issue?.message).toBe(
          'Số CMND/CCCD/Hộ chiếu là bắt buộc đối với khách hàng cá nhân',
        );
      }
    });

    it('should require organizationName and taxCode for CORPORATE customerType', () => {
      const payload = {
        ...validBasePayload,
        customerType: CustomerType.CORPORATE,
        organizationName: null,
        taxCode: null,
      };
      const result = CreateCustomerBodySchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const orgNameIssue = result.error.issues.find((i) =>
          i.path.includes('organizationName'),
        );
        const taxCodeIssue = result.error.issues.find((i) =>
          i.path.includes('taxCode'),
        );
        expect(orgNameIssue?.message).toBe(
          'Tên tổ chức/công ty là bắt buộc đối với khách hàng doanh nghiệp',
        );
        expect(taxCodeIssue?.message).toBe(
          'Mã số thuế là bắt buộc đối với khách hàng doanh nghiệp',
        );
      }
    });
  });
});
