# Onboard 0.7.3 — September 30, 2026

Native/service **0.7.3** is installed and running on the development Mac. Its Activity view was verified on screen. Existing settings and local model/runtime files were reused; the prior application is retained as a backup. Sign in again and reconnect add-ins after the service restart.

This repository contains matching source/installer files and add-in packages **0.6.1**. Source is in `Onboard-Source.zip`; Setup verifies and extracts it. Model weights are downloaded or reused after checksum verification, not committed to GitHub.

New capabilities include live Activity stages and diagnostic export, encrypted model temporary storage, tighter worker read/write/process boundaries, central mTLS audit tooling, managed browser restrictions, and an administrator-operated signed update path. See [HARDENING-0.7.3.md](HARDENING-0.7.3.md) for precise scope and limitations.

The Azure Web App package is prepared for the existing commercial test registration. **Uploading these files to GitHub does not deploy Azure or update the Teams catalog.** The existing hosted deployment/catalog has not been changed by this release operation. Outlook/Word local manifests and the hosted Teams/Word packages are provided separately.

Validation: 377 Python tests, 77 add-in JavaScript tests, 11 Teams tests and four Rust tests passed; eight real OS/storage/mTLS checks and six native code-identity checks passed. A real local model run succeeded under the new encryption and worker restrictions. Native compilation and exact ZIP signature verification passed with development signing.

Still open: MIP SDK protected-document processing/output, Developer ID Application signing and notarization enrollment, approved audit hosting and browser network controls, managed runtime distribution and live government acceptance. This remains a PUBLIC-content development release, not a government-authorized or notarized production distribution.
