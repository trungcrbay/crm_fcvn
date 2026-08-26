import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiPaginationQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Trang hiện tại',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Số lượng bản ghi mỗi trang',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Từ khóa tìm kiếm',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      example: 'ASC',
      description: 'Thứ tự sắp xếp',
    }),
  );
}
