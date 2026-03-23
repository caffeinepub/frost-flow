# Frost Flow

## Current State
Backend has `registerOrAutoAdmin()` that only grants admin if `adminList` is empty. This is failing because the list may already have stale entries from previous failed calls, blocking the claim permanently.

## Requested Changes (Diff)

### Add
- `claimAdminWithCode(secretCode: Text) -> Bool` backend function: if the secret code matches the hardcoded admin password (`FROSTFLOW2024`), the caller is added as admin regardless of current state (unless an admin already exists and is different). Any logged-in user can use this code once to become the first admin.
- Admin panel UI: input field for secret admin code, replacing the plain "Claim Admin Access" button.

### Modify
- Remove `registerOrAutoAdmin()` - replace with `claimAdminWithCode()`.
- Keep `checkAdminAccess()` as-is.
- Admin panel page: show code input form when not admin; show full admin dashboard when admin.

### Remove
- Old `registerOrAutoAdmin()` function and related logic.

## Implementation Plan
1. Update `main.mo`: add `claimAdminWithCode(code: Text)` function with hardcoded secret.
2. Update admin panel React component to show a code-entry form instead of plain button.
