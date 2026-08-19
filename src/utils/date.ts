/**
 * Auction date formatting.
 *
 * `auction_start` carries no timezone ("2026-08-19T09:00:00"), so Date parses it
 * in the viewer's local zone. That is intentional — an auction time means the
 * local time it is called at. Never append "Z" to these strings.
 */

const full = new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const dayOnly = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
});

export function parseAuctionStart(auctionStart: string): Date {
  return new Date(auctionStart);
}

/** "2026-08-19T09:00:00" -> "Wed, Aug 19, 9:00 a.m." */
export function formatAuctionStart(auctionStart: string): string {
  return full.format(parseAuctionStart(auctionStart));
}

/** Compact form for cards. "2026-08-19T09:00:00" -> "Aug 19" */
export function formatAuctionDay(auctionStart: string): string {
  return dayOnly.format(parseAuctionStart(auctionStart));
}

const dayTime = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Day and time without the weekday, for the chip on a card.
 * "2026-08-19T09:00:00" -> "Aug 19, 9:00am"
 *
 * Assembled from parts rather than string-replaced on the formatted output:
 * en-CA renders the day period as "a.m." with periods and, in some ICU builds,
 * a non-breaking space in front of it. Reading the parts means the chip's
 * spelling is ours, not whatever the runtime happens to produce.
 */
export function formatAuctionDayTime(auctionStart: string): string {
  const parts = dayTime.formatToParts(parseAuctionStart(auctionStart));
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';

  const period = part('dayPeriod').replace(/[^a-z]/gi, '').toLowerCase();

  return `${part('month')} ${part('day')}, ${part('hour')}:${part('minute')}${period}`;
}

/** True once the auction start time has passed. */
export function hasStarted(auctionStart: string, now: Date = new Date()): boolean {
  return parseAuctionStart(auctionStart).getTime() <= now.getTime();
}

