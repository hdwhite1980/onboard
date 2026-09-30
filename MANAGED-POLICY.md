# Administrator-owned endpoint policy

Onboard 0.6 reads `/Library/Application Support/Onboard AI/managed-policy.json` for administrator-deployed restrictions. The file and all ancestors must be owned by root, not group/other writable, and not symlinks. Ordinary Settings cannot relax these restrictions. Use the organization's MDM or administrator deployment procedure; Onboard does not request elevation or install a policy itself.

All fields below are required. Empty allowlists allow no configured value in that category. Replace the example tenant and origin with the actual approved values; never put credentials in this file.

```json
{
  "schema": 1,
  "name": "Organization public-content pilot",
  "allow_cloud": false,
  "allow_hybrid": false,
  "allow_saved_work": true,
  "allowed_tenants": [],
  "allowed_provider_origins": [],
  "public_label_mappings": []
}
```

`allowed_tenants` matches configured tenant identifiers exactly, case-insensitively. Prefer tenant GUIDs. `allowed_provider_origins` contains exact HTTPS origins; approved origin does not imply provider protocol compatibility. `public_label_mappings` contains exact lowercase `tenantGUID:labelGUID` values for PUBLIC labels only. No field authorizes Internal/FCI/CUI processing or decryption.

Policy is re-read on operations and hybrid steps; malformed/untrusted/unreadable policy blocks processing. A conflicting configuration must be repaired in Settings. Status, stop, sign-out and saved-work deletion remain available where the account can be authenticated. An already dispatched network request cannot be recalled. Removing the file by an administrator returns this development build to its public-content development settings.

This is a local, administrator-owned restriction mechanism. It is **not** centrally signed policy, anti-rollback, fleet enrollment, a remote revocation guarantee, a tamper-resistant boundary against a host administrator, or government authorization. The source development installation also does not protect its executable code from modification by its owner. A customer-managed signed application and actual control-plane design are subsequent work.


## 0.7.3 controls

Managed builds now require a central audit collector and block browser computer control unless real external browser network restrictions are declared by administrator policy. Labeled content remains blocked pending a validated MIP rights/output path. See [the 0.7.3 enrollment instructions](HARDENING-0.7.3.md). Existing development configurations do not implicitly enroll in a collector or enable protected data.
