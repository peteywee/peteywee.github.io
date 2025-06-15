// src/utils/helpers.ts

/**
 * Formats an ISO 8601 date string into a user-friendly local date and time.
 * @param dateString The date string (e.g., "2023-10-27T10:00:00Z").
 * @returns Formatted date string (e.g., "Oct 27, 2023, 10:00 AM").
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      // Optionally add timezone: timeZoneName: 'short'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // Return original if error
  }
};

/**
 * Formats a file size in bytes into a human-readable string (e.g., "1.23 MB").
 * @param bytes The file size in bytes.
 * @returns Formatted file size string.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 2; // Decimal places
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Truncates a given text to a maximum length, appending "..." if truncated.
 * @param text The input string.
 * @param maxLength The maximum allowed length for the string.
 * @returns The truncated string.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Highlights occurrences of a search query within a text string.
 * @param text The full text string.
 * @param query The search term to highlight.
 * @returns A JSX element with highlighted parts.
 */
export const highlightText = (text: string, query: string): JSX.Element => {
  if (!query) return <span>{text}</span>;

  // Escape special characters in the query for regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        // Compare case-insensitively, but keep original casing for the part
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 font-semibold rounded-sm px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};
