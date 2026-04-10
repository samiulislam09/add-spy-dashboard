# Compliance Boundary

This project is intentionally designed for **public or authorized ad intelligence** only.

## Allowed Inputs

- Public ad libraries and transparency APIs (Meta/TikTok/Google-compatible sources)
- Customer-provided exports (CSV/JSON)
- Credentials/tokens explicitly provided by the workspace owner for authorized connectors

## Explicitly Disallowed

- Hidden-login scraping of private accounts
- Anti-bot evasion or CAPTCHA bypass techniques
- Collection of non-public personal data
- Circumventing platform terms or technical access controls

## Implementation Points

- Connector interfaces are in `ingestion/src/types.ts` and must normalize only approved source data.
- Ingestion source metadata should include compliance context (`configJson.complianceBoundary`).
- API/UI language should refer to "public/authorized sources" and avoid implying access to private ad systems.
