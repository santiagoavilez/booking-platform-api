// src/interfaces/http/dto/define-availability.dto.ts

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
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format (e.g., 09:00)',
  })
  startTime: string;

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
  @IsInt()
  @Min(0, { message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' })
  @Max(6, { message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' })
  dayOfWeek: number;

  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots: TimeSlotDto[];
}

/**
 * ARCHITECTURAL DECISION:
 * - What: DTO to validate weekly availability schedule from frontend
 * - Why: Validates HTTP data before passing to use case
 * - Structure: Accepts the frontend's format with enabled/disabled days
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (HTTP adapter)
 * - Is transformed to DefineAvailabilityInput before calling the use case
 * - The controller handles the transformation from this DTO to use case input
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  schedule: DayScheduleDto[];
}
