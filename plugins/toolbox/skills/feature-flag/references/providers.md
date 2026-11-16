# Flag providers: detection and minimal setup

Decide which mechanism gates the feature. Order: reuse what exists, then the recommended default for the stack, then ask.

## Contents

- Detection order
- Recommended defaults by context
- OpenFeature shape
- Minimal local provider
- Compile-time flags
- Call-site shape by stack
- Anti-choices

## Detection order

1. Grep manifests for a flag SDK: `@openfeature/*`, `launchdarkly-*`, `unleash-client`, `@unleash/*`, `flagsmith*`, `@growthbook/*`, `posthog-js`, `posthog-node`, `configcat*`, `@splitsoftware/*`, `statsig*`, `flipper`, `django-waffle`, `github.com/open-feature/go-sdk`, `dev.openfeature`.
2. Grep for a home-grown predicate module: files named `flags`, `featureFlags`, `feature-flags`, `toggles`, `features` exporting `isEnabled`, `isFeatureEnabled`, `hasFlag`, `useFeature`.
3. Grep for env-based gates: `process.env.FEATURE_`, `os.environ["FEATURE_`, `ENV["FEATURE_`, `os.Getenv("FEATURE_`.
4. Grep for compile-time switches: `Kconfig`, `sdkconfig`, `prj.conf`, `[features]` in `Cargo.toml`, `build_flags` in `platformio.ini`, `#ifdef FEATURE_`.
5. Check `## Flags` of `docs/feature-map.md`; its `Provider` column is authoritative when present.

If one mechanism is found, reuse it. If several coexist, prefer the one with the most read sites and note the others. Never add a second runtime SDK.

## Recommended defaults by context

| Context | Recommended | Alternative |
| --- | --- | --- |
| Web or API service, no flags yet | OpenFeature SDK + in-memory or env provider; swap to a vendor provider later without touching call sites | typed `config/features.<ext>` module with one `isEnabled(key)` function |
| Mobile app, no flags yet | OpenFeature (JS/Kotlin/Swift SDKs exist) with a remote-config-backed provider, or the app's existing remote config (Firebase Remote Config) | local typed config module shipped with the build |
| Monorepo with an existing vendor SDK | the existing SDK, wrapped behind OpenFeature only if OpenFeature is already present | direct SDK call at the single gate site |
| CLI tool | env variable `FEATURE_<KEY>` read once at startup into a typed config | hidden subcommand flag |
| Embedded or firmware | compile-time: Kconfig option, `#ifdef`, cargo feature | runtime NVS/EEPROM setting only when the user needs field toggling |
| Library or SDK | constructor option or config struct field | none; do not read env inside a library |

Offer the recommended option with `(Recommended)` and the alternative; a third choice `Other` for anything else.

## OpenFeature shape

Evaluation API, same across SDKs:

```text
client = OpenFeature.getClient()
value  = client.getBooleanValue(flagKey, defaultValue, evaluationContext?)
```

String, number, and object variants follow the same signature. Provider is set once at startup: `OpenFeature.setProvider(provider)`. Verify the exact package name and method casing in the installed SDK before writing a task; do not guess from memory.

Plan task when adding OpenFeature from scratch:

1. Add the SDK dependency for the stack.
2. Create `shared/config/flags.<ext>` (FSD: `shared/config`) that sets the provider and exports one typed accessor per flag key, for example `isCheckoutEnabled(ctx)`. Call sites import the accessor, never the SDK.
3. Provider: in-memory with a map of defaults for local and tests; env-backed for deployments.

## Minimal local provider

When a dependency is unwanted:

```text
config/features.<ext>
  FEATURES = { "<key>": <default> }      // typed map, one entry per flag
  isEnabled(key): read env override FEATURE_<KEY_UPPER_SNAKE> else FEATURES[key]
```

One file, one function, no classes. Document each key with owner and review date in a comment above its entry.

## Compile-time flags

| Build system | Declare | Gate | Exclude from build |
| --- | --- | --- | --- |
| ESP-IDF / Zephyr Kconfig | `config APP_FEATURE_<KEY>` with `default y` in `Kconfig.projbuild` or `Kconfig` | `#if CONFIG_APP_FEATURE_<KEY>` around the single registration call | `if(CONFIG_APP_FEATURE_<KEY>)` around `SRCS` in `CMakeLists.txt` |
| PlatformIO | `build_flags = -DFEATURE_<KEY>=1` per env | `#if FEATURE_<KEY>` | `build_src_filter` |
| Cargo | `[features] <key> = []` | `#[cfg(feature = "<key>")]` on the module declaration | automatic |
| C/C++ generic | `-DFEATURE_<KEY>` | `#ifdef FEATURE_<KEY>` | conditional sources in the build file |

Default equals the current build so existing artifacts are unchanged.

## Call-site shape by stack

The gate reads the flag once and either skips registration or returns the "absent" response. Examples of the registration-level gate:

| Stack | Off behavior |
| --- | --- |
| Express / Fastify / Hono | do not call `router.<verb>(path, handler)`; unmatched path yields the framework 404 |
| NestJS | guard on the controller returning `NotFoundException` |
| Next.js App Router | `notFound()` at the top of `page.tsx` or `route.ts` |
| FastAPI / Flask / Django | conditional `include_router` / blueprint registration / url pattern |
| Rails | `constraints ->(req) { Flags.enabled?(:key) }` around the route |
| React Navigation | render `<Stack.Screen>` / `<Tab.Screen>` conditionally |
| Flutter GoRouter | omit the `GoRoute` from the route list, or `redirect` to home |
| SwiftUI / Compose | omit the `NavigationLink` / `composable(route)` |
| CLI | do not register the subcommand |
| Job / queue | do not register the worker or the schedule |
| Event consumer | do not subscribe |
| FreeRTOS | do not call `xTaskCreate` |

Choose a lower boundary (dispatcher or internal branch) only when the entrypoint is shared with other features.

## Anti-choices

- Reading the flag in several files for one feature.
- Introducing a vendor SDK when the repository has none and the user did not ask for a vendor.
- Reading `process.env` directly at call sites.
- A flag with no default or no owner.
- Removing or renaming existing flags while adding one; that is `feature-unflag` work.
