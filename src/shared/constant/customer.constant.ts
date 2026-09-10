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

export enum GroupType {
  VIP = 'vip',
  NORMAL = 'normal',
  OTHER = 'other',
}

export const GroupTypeLabel = {
  [GroupType.VIP]: 'Khách hàng VIP',
  [GroupType.NORMAL]: 'Khách hàng thường',
  [GroupType.OTHER]: 'Khách hàng khác',
};

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum IdentityType {
  PASSPORT = 'passport',
  CCCD = 'cccd',
  CMND = 'cmnd',
}

export const IDENTITY_TYPE_LABEL = {
  [IdentityType.CMND]: 'CMND',
  [IdentityType.CCCD]: 'CCCD',
  [IdentityType.PASSPORT]: 'Hộ chiếu',
};

export enum AppointmentActivityType {
  DIRECT = 'direct', // Gặp trực tiếp
  CALL = 'call', // Gọi điện thoại
  ONLINE_MEETING = 'online_meeting', // Họp trực tuyến
  OTHER = 'other', // Khác
}

export const AppointmentActivityTypeLabel = {
  [AppointmentActivityType.DIRECT]: 'Gặp trực tiếp',
  [AppointmentActivityType.CALL]: 'Gọi điện thoại',
  [AppointmentActivityType.ONLINE_MEETING]: 'Họp trực tuyến',
  [AppointmentActivityType.OTHER]: 'Khác',
};

export enum AppointmentStatus {
  SCHEDULED = 'scheduled', // Đã lên lịch hẹn
  COMPLETED = 'completed', // Đã hoàn thành
  CANCELLED = 'cancelled', // Đã hủy
}

export const AppointmentStatusLabel = {
  [AppointmentStatus.SCHEDULED]: 'Đã lên lịch',
  [AppointmentStatus.COMPLETED]: 'Đã hoàn thành',
  [AppointmentStatus.CANCELLED]: 'Đã hủy',
};

export enum CustomerStatus {
  ACTIVE = 'active', // Đang hoạt động
  INACTIVE = 'inactive', // Ngừng hoạt động
  APPROACHING = 'approaching', // Đang tiếp cận (tiềm năng)
}

export const CustomerStatusLabel = {
  [CustomerStatus.ACTIVE]: 'Đang hoạt động',
  [CustomerStatus.INACTIVE]: 'Ngừng hoạt động',
  [CustomerStatus.APPROACHING]: 'Đang tiếp cận',
};
