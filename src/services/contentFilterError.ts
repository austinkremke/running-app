/** Postgres triggers (see 20260730000003_content_filter.sql) raise an
 *  exception prefixed 'CONTENT_REJECTED:' when a free-text insert/update
 *  contains disallowed language — surfaced here as a friendly message
 *  instead of a raw Postgres error string. */
const FRIENDLY_MESSAGE = "That message contains language that isn't allowed. Please rephrase it.";

function messageOf(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === 'string' ? message : null;
  }
  return null;
}

export function isContentRejectedError(error: unknown): boolean {
  return messageOf(error)?.includes('CONTENT_REJECTED') ?? false;
}

/** Supabase errors (PostgrestError) aren't Error instances — this always
 *  returns a real Error, either the friendly rewrite or the original
 *  message wrapped, so callers can safely `throw` or read `.message`. */
export function toContentFilterFriendlyError(error: unknown): Error {
  if (isContentRejectedError(error)) {
    return new Error(FRIENDLY_MESSAGE);
  }

  if (error instanceof Error) return error;

  const message = messageOf(error);
  return new Error(message ?? 'Something went wrong. Please try again.');
}
