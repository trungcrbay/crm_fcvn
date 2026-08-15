export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
  REPRESENTATIVE = 'representative',
}

export const CustomerTypeLabel = {
  [CustomerType.INDIVIDUAL]: 'Khách hàng cá nhân',
  [CustomerType.CORPORATE]: 'Khách hàng doanh nghiệp',
  [CustomerType.REPRESENTATIVE]: 'Văn phòng đại diện',
};
