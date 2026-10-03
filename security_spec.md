# Security Specification: Apuração do Boi ERP Database

## 1. Data Invariants
- `sheet_rows`: Document ID must be a valid store ID (`isValidId`). Store row must contain `storeId` and `storeName`.
- `sheet_snapshots`: Document ID must be a valid ID. Must contain `id`, `name`, `date`, `timestamp`, `author`, `source`, `rows`, and totals. Cannot be overwritten with corrupt non-object structures.
- `stock_launches`: Document ID must be a valid ID. Must contain `id`, `date`, `timestamp`, `storeId`, `storeName`, `operatorName`.
- `stores`: Document ID must be a valid ID. Must contain `id`, `code`, `name`.
- `suppliers`: Document ID must be a valid ID. Must contain `id`, `code`, `name`, `cnpj`.
- `products`: Document ID must be a valid ID. Must contain `id`, `code`, `name`, `category`.

## 2. Dirty Dozen Payloads & Rejection Tests
1. Oversized Document ID (>128 chars or special chars injection).
2. Missing required fields in `sheet_rows` (e.g. omitting `storeId`).
3. Non-numeric values for calculation fields (e.g. string in `pedidoDianteiro`).
4. Corrupt snapshot payload lacking `timestamp` or `rows`.
5. Empty `name` or `author` in snapshot.
6. Malformed JSON or negative lengths.
7. Modifying non-existent collection (blocked by default-deny).
8. Attempting to inject administrative escalation keys.
9. Launch record missing `operatorName`.
10. Launch record with corrupt timestamp.
11. Attempting arbitrary collection writes (e.g. `users`, `configs` without schema).
12. Store document with oversized code (>32 chars).
