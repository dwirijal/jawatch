<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Mode Rules

Use the current project stage to decide how aggressive changes should be.

## Development Mode

If the app is still in development, prefer the clean solution over the smallest patch.

- Do not be overly conservative about refactors.
- It is acceptable to make broad structural updates when they simplify the system.
- It is acceptable to replace temporary compatibility layers with cleaner foundations.
- Prefer fixing root architectural issues instead of stacking defensive workarounds.
- Public route design, canonical slugs, metadata shape, and data contracts may be rewritten if that produces a cleaner product.

## Production Mode

If the app is already in production or the user explicitly says to treat it as production, use the safer approach.

- Keep changes narrowly scoped.
- Preserve backward compatibility unless the user explicitly approves breaking changes.
- Prefer incremental migrations, fallbacks, redirects, and compatibility shims.
- Avoid broad refactors unless they are necessary to resolve a high-impact bug.

## Priority Rule

When the user explicitly states the project is still in development, follow Development Mode even if the safer path would normally be preferred.

When the user explicitly states the project is in production, follow Production Mode.
