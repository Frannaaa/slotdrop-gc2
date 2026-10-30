# Booking links and PDF review — October 29, 2026

Detail, Selection, Checkout and Confirmation previously read only the first occurrence of a URL field. Conflicting session IDs or quantities could silently select the wrong value. Selection also treated an explicitly empty quantity as its default of one.

All four pages now use the same supported-field parser before making an API request. Repeated, unknown or explicitly empty fields produce a visible invalid-link error. No booking/receipt request or Continue action survives the invalid link. An omitted optional quantity still defaults to one; a valid two-person link retains two.

The supplied 72-page brand book was the source for its repair. All 72 pages, extracted page text and 17 external links are preserved. The Explore link now opens the prototype's Browse route. There are 74 navigation bookmarks. Screenshot recompression keeps the original image dimensions and vector text and reduces the file from 19,917,967 to 12,200,950 bytes (38.7% smaller). Representative current and archive pages were rendered and inspected.

Validation: syntax; 38 API/unit tests (37 passed locally and one PostgreSQL-only test skipped locally); full flow; eight SQL scenario groups; 33 browser cases, including seven malformed booking-page URL examples in the new regression. CI runs PostgreSQL and production-container restart checks on the actual commit.

The shared helper/parser and its unit test are proposed in official PR #34. Teammates' customer pages remain their assigned implementation; the complete fixed pages are in the private reference and the matching Doc examples.
