// src/interfaces/http/dto/define-availability.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * DTO for a single time slot within a day
 */
export class TimeSlotDto {
  @ApiProperty({
    description: 'Start time in HH:mm format (24h)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format (e.g., 09:00)',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format (24h)',
    example: '17:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format (e.g., 17:00)',
  })
  endTime: string;
}

/**
 * DTO for a day's schedule configuration
 */
export class DayScheduleDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0, { message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' })
  @Max(6, { message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Whether this day is available for appointments',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'Time slots for this day',
    type: [TimeSlotDto],
    example: [{ startTime: '09:00', endTime: '17:00' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots: TimeSlotDto[];
}

/**
 *
 * FRONTEND PAYLOAD FORMAT:
 * {
 *   "schedule": [
 *     { "dayOfWeek": 1, "enabled": true, "timeSlots": [{ "startTime": "09:00", "endTime": "17:00" }] },
 *     { "dayOfWeek": 6, "enabled": false, "timeSlots": [] }
 *   ]
 * }
 */
export class DefineAvailabilityDto {
  @ApiProperty({
    description:
      'Weekly schedule (one entry per day 0-6). Only enabled days with timeSlots are stored.',
    type: [DayScheduleDto],
    example: [
      {
        dayOfWeek: 1,
        enabled: true,
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
      },
      {
        dayOfWeek: 2,
        enabled: true,
        timeSlots: [
          { startTime: '09:00', endTime: '13:00' },
          { startTime: '14:00', endTime: '18:00' },
        ],
      },
      {
        dayOfWeek: 0,
        enabled: false,
        timeSlots: [],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  schedule: DayScheduleDto[];
}
