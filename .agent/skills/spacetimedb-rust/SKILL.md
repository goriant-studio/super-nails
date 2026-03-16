---
name: spacetimedb-rust
description: Writing and deploying SpacetimeDB v2.x Rust modules. Use when creating tables, reducers, or publishing to SpacetimeDB Maincloud.
---

# SpacetimeDB Rust Module Skill (v2.0.5)

## Setup

```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
spacetimedb = "=2.0.5"   # Pin to exact CLI version
log = "0.4"
```

```rust
use spacetimedb::{table, reducer, Table, ReducerContext};
```

## Declaring Tables

In v2, use `accessor = name` (NOT `name = name` from v1). The `accessor` is the method name on `ctx.db`.

```rust
// ✅ v2 correct
#[table(accessor = booking, public)]   // ctx.db.booking()
pub struct Booking {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub salon_id: u32,
    pub customer_name: String,
}

// ❌ v1 style — DOES NOT WORK in v2
// #[table(name = bookings, public)]
```

> The SQL table name is the lowercase struct name by default. To override: `#[table(accessor = booking, name = "bookings", public)]`.

## CRUD Operations

```rust
#[reducer]
pub fn example(ctx: &ReducerContext) {
    // Get table handle
    let bookings = ctx.db.booking();

    // INSERT — returns the inserted row (with auto_inc id filled in)
    let row = bookings.insert(Booking { id: 0, salon_id: 1, customer_name: "Alice".into() });
    let new_id = row.id;

    // ITER — scan all rows
    for b in bookings.iter() {
        log::info!("{}", b.customer_name);
    }

    // FIND by primary key
    if let Some(found) = bookings.id().find(&new_id) {
        // UPDATE — must go through UniqueColumn
        bookings.id().update(Booking { customer_name: "Bob".into(), ..found });
    }

    // DELETE by primary key
    bookings.id().delete(&new_id);

    // COUNT
    log::info!("Total: {}", bookings.count());
}
```

## Filtering (non-unique columns)

For non-primary-key filtering, use `.iter().filter()`:

```rust
let salon_bookings: Vec<_> = ctx.db.booking().iter()
    .filter(|b| b.salon_id == target_salon_id)
    .collect();
```

For indexed columns (`#[index(btree)]`), use `RangedIndex::filter`:

```rust
ctx.db.booking().salon_id().filter(1..=3)
```

## Optional / None

`Option<String>` is supported natively. Use `None` for null fields.

## Timestamp

```rust
// Get current epoch milliseconds (VN +7 offset calculation)
let epoch_ms = ctx.timestamp.to_micros_since_unix_epoch() / 1000;
```

## Init Reducer

```rust
#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    // Called once on first publish
    seed_data(ctx);
}
```

## Build & Publish

```bash
# Build module (checks for errors)
spacetime build

# Login (first time)
spacetime login

# Publish to Maincloud (creates new DB)
spacetime publish --server maincloud super_nails

# Re-publish (update existing DB)
spacetime publish --server maincloud super_nails

# Check logs
spacetime logs --server maincloud super_nails

# Run SQL query
spacetime sql --server maincloud super_nails "SELECT * FROM booking"

# Call a reducer
spacetime call --server maincloud super_nails seed_static_data
```

## Common Mistakes (v1 → v2 Migration)

| v1 (BROKEN) | v2 (CORRECT) |
|---|---|
| `#[table(name = bookings)]` | `#[table(accessor = booking)]` |
| `ctx.db.bookings()` | `ctx.db.booking()` |
| `ctx.db.bookings().id().find(&id)` | `ctx.db.booking().id().find(&id)` |
| `spacetimedb = "1.5"` | `spacetimedb = "=2.0.5"` |

## Cloudflare Worker Integration

After publishing, set `SPACETIMEDB_TOKEN` secret in Cloudflare:
```bash
cd server-cloudflare-function
npx wrangler secret put SPACETIMEDB_TOKEN
# Paste the token from: spacetime login token --server maincloud
```

The token authenticates REST calls to `https://maincloud.spacetimedb.com/v1/database/super_nails/sql`.
