/**
 * @deprecated Import from `./quiet-hours` — kept for Wave 3A import paths.
 */
export {
  DEFAULT_QUIET_END_HOUR as DEFAULT_SMS_QUIET_END_HOUR,
  DEFAULT_QUIET_START_HOUR as DEFAULT_SMS_QUIET_START_HOUR,
  isWithinQuietHours as isWithinSmsQuietHours,
  nextQuietHoursEnd as nextSmsQuietHoursEnd,
  type QuietHoursConfig as SmsQuietHoursConfig,
} from './quiet-hours'
