# Scan Record Development Roadmap

Source specification: `scan_record_system_specification_v1.docx`

## Current Baseline

- Page paths and tabBar icon files are present.
- Scan history uses `scanBatches`.
- Normal duplicate detection uses `content`.
- Book duplicate detection prioritizes `barcode`.
- History supports search, mode filter, recent searches, pagination, selection, batch delete, and batch copy.
- Detail page supports pagination, per-record copy, per-record delete, batch copy, batch delete, and scan again.
- Input rules support trim, uppercase, newline allowance, max length, enter-submit, and book barcode validation.
- Copy rules now support copy range, book fields, separators, include time, and include mode.
- Advanced API helper functions exist for template replacement, JSON/XML parsing, field mapping, scan rule matching, and default API fallback.
- UI has been refreshed to a concise blue theme.

## Next Development Order

1. History state retention
   - Preserve search keyword, mode filter, page size, page index, and scroll position when returning from detail.
   - Add date filter controls and persistence.

2. Advanced API configuration UI
   - Support multiple API configs, not only one visible config.
   - Add Header editor, Query param editor, JSON Body editor, raw response toggle, empty value mode toggle.
   - Improve test preview to show raw response, parsed fields, and final display preview.

3. Scan rule routing UI
   - Add rule list editor with enabled state, regex, priority, and bound API config.
   - Validate regex before save.
   - Add default API selection and optional no-match hint.

4. I18n cleanup
   - Move hard-coded page labels, toasts, dialogs, filters, copy-rule text, and empty states into `utils/i18n.js`.
   - Verify Simplified Chinese, Traditional Chinese, and English coverage.

5. Storage and stability
   - Add near-10MB warning before cleanup.
   - Keep automatic oldest-batch cleanup as final fallback.
   - Add stronger request timeout/network error messages.

6. Final UI QA
   - Keep all pages aligned with the blue visual system.
   - Reduce nested card density where possible.
   - Verify empty, loading, selected, disabled, and error states.
