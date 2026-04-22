import type { TranslatedText } from '~~/types/announcement'
import { renderInlineBold } from './markdown-inline'
import { splitParagraphs } from './text'

type Lang = keyof TranslatedText

/**
 * Splits an admin-authored body into paragraphs and turns every **word**
 * into a <strong>. Shared between the public home section and the live
 * preview inside the admin editor so both stay in sync if the rendering
 * rules change (e.g. adding italic, links, etc.).
 */
export function renderBodyParagraphs(body: TranslatedText, lang: Lang): string[] {
  const text = body[lang] ?? body.eu ?? ''
  return splitParagraphs(text).map(p => renderInlineBold(p))
}
