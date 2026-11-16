# Feature flag detection

Find every flag mechanism already in the repository and describe it without changing it.

## Providers and signals

| Provider | Dependency signal | Read-site signal |
| --- | --- | --- |
| OpenFeature | `@openfeature/*`, `openfeature` (py), `dev.openfeature` (jvm), `github.com/open-feature/go-sdk` | `getBooleanValue(`, `getStringValue(`, `getObjectValue(`, `get_boolean_value(` |
| LaunchDarkly | `launchdarkly-*`, `ldclient`, `launchdarkly-server-sdk` | `.variation(`, `.boolVariation(`, `useFlags(` |
| Unleash | `unleash-client`, `@unleash/proxy-client-react`, `UnleashClient` | `.isEnabled(`, `useFlag(` |
| Flagsmith | `flagsmith`, `flagsmith-nodejs`, `react-native-flagsmith` | `hasFeature(`, `getValue(` |
| GrowthBook | `@growthbook/growthbook*`, `growthbook` | `isOn(`, `getFeatureValue(`, `useFeatureIsOn(` |
| PostHog | `posthog-js`, `posthog-node`, `posthog` | `isFeatureEnabled(`, `getFeatureFlag(`, `useFeatureFlagEnabled(` |
| ConfigCat, Split, Optimizely, Statsig | respective SDK packages | `getValue(`, `getTreatment(`, `isFeatureEnabled(`, `checkGate(` |
| Environment variables | none | `process.env.FEATURE_*`, `os.environ["FEATURE_*"]`, `ENV["FEATURE_*"]`, `os.Getenv("FEATURE_` |
| Config file | `config/features.*`, `features.json`, `flags.yml` | `config.features.<name>`, `features.<name>` |
| Rails | `flipper` | `Flipper.enabled?(` |
| Django | `django-waffle` | `waffle.flag_is_active(`, `{% flag %}` |
| Compile-time | `sdkconfig`, `prj.conf`, `Kconfig`, `Cargo.toml` `[features]`, `build_flags` | `#ifdef CONFIG_*`, `#if FEATURE_*`, `#[cfg(feature = "` |
| Home-grown | a module named `flags`, `featureFlags`, `toggles`, `features` exporting a predicate | `isEnabled(`, `isFeatureEnabled(`, `hasFlag(` |

Grep dependency manifests first; a read-site match without a known provider means home-grown, record `provider: custom (<module path>)`.

## What to record per flag

| Field | Source |
| --- | --- |
| `key` | literal string or constant name passed to the read call |
| `provider` | row above, or `custom`, `env`, `config`, `kconfig`, `preprocessor`, `cargo-feature` |
| `type` | `boolean` unless the read call returns a string, number, or object variant |
| `default` | fallback argument of the read call, env default, or config value in the committed file; `?` when evaluated remotely with no local default |
| `read_sites` | every `file:line` where the key is read; several sites for one key are expected and must all be listed |
| `features` | features from the map whose module set contains a read site |
| `stage` | lifecycle stage, see below |

## Lifecycle stage

Assign from evidence only; never guess intent.

| Stage | Evidence |
| --- | --- |
| `define` | key declared (constant, config entry) but no read site |
| `develop` | read sites exist; default is off, or the gated feature has no tests |
| `production` | default is on, or the flag is read in a released screen or route with tests |
| `cleanup` | every read site resolves to a constant (`if (true)`, env pinned in all config files) |
| `unknown` | none of the above can be established from the repository |

## Aliases

A key may be referenced indirectly. Search the exact key and these variants before counting read sites:

- `camelCase`, `PascalCase`, `snake_case`, `SCREAMING_SNAKE_CASE`, `kebab-case` of the key
- a constant whose value is the key (`const CHECKOUT_V2 = 'orders.checkout-v2'`), then the constant name
- a wrapper function or hook named after the key (`useCheckoutV2`, `isCheckoutV2Enabled`)

Record alias hits under `read_sites` with the alias used.

## Flags section template

```markdown
## Flags

| Key | Provider | Type | Default | Stage | Features | Read sites |
| --- | --- | --- | --- | --- | --- | --- |
| `orders.checkout-v2` | launchdarkly | boolean | false | develop | Checkout | `apps/web/src/shared/config/flags.ts:14`, `apps/api/src/routes/checkout.ts:31` |
| `CONFIG_APP_FEATURE_OTA` | kconfig | boolean | y | production | OTA update | `main/ota.c:12`, `main/main.c:88` |
```

Write `No feature flag mechanism detected.` when the table would be empty. Do not propose adding one; that belongs to the `feature-flag` skill.
