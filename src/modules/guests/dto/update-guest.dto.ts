import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateGuestDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the guest',
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'guest',
    description: 'Role assigned to the guest',
  })
  @IsString({ message: 'Role must be a string' })
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Active status of the guest',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
