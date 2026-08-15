/**
 * Shared field styling for the crop panels.
 *
 * These panels hand-roll their inputs rather than using `@/components/form`,
 * and the copied class string set a dark background without a dark text
 * colour — dark text on a dark field, i.e. invisible in dark mode. Keeping the
 * classes in one place stops that drifting again.
 *
 * `<option>` needs its own colours: it does not reliably inherit them from the
 * `<select>`, which is why `@/components/form/Select` styles options too.
 */
export const fieldClass =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 " +
  "dark:border-gray-600 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export const optionClass = "text-gray-700 dark:bg-gray-900 dark:text-white/90";
