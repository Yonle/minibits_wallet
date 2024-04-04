
import { I18nOptions } from "i18n-js"
import { i18n } from "./i18n"
import { TxKeyPath } from "./i18n"

/**
 * Translates text.
 *
 * @param key The i18n key.
 * @param options The i18n options.
 * @returns The translated text.
 *
 * @example
 * Translations:
 *
 * ```en.ts
 * {
 *  "hello": "Hello, {{name}}!"
 * }
 * ```
 *
 * Usage:
 * ```ts
 * import { translate } from "i18n-js"
 *
 * translate("common.ok", { name: "world" })
 * // => "Hello world!"
 * ```
 */

export function translate(key: TxKeyPath, options?: Partial<I18nOptions> & { [parameter: string]: any }) {
  return i18n.t(key, options as I18nOptions)
}
