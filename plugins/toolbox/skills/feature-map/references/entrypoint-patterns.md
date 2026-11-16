# Entrypoint patterns by stack

How to detect a stack, which entrypoint kinds it exposes, and what to grep for. Use deterministic extractors first when listed; grep is the fallback.

## Contents

- Stack detection signals
- Entrypoint kinds
- Web backends (http-route, graphql-operation)
- Web frontends (screen)
- Mobile and desktop (screen)
- CLI (command)
- Jobs and queues (job)
- Events and messaging (event)
- Embedded and firmware (task, command, event)
- Deterministic extractors
- Layer detection heuristics

## Stack detection signals

| Manifest or marker | Stack |
| --- | --- |
| `package.json` | Node; read `dependencies` to pick framework rows below |
| `pyproject.toml`, `requirements.txt`, `Pipfile` | Python |
| `Gemfile` | Ruby |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `*.csproj`, `*.sln` | .NET |
| `pom.xml`, `build.gradle(.kts)` | JVM |
| `pubspec.yaml` | Flutter / Dart |
| `*.xcodeproj`, `Package.swift` | iOS / Swift |
| `build.gradle` + `AndroidManifest.xml` | Android |
| `platformio.ini`, `sdkconfig`, `CMakeLists.txt` + `idf_component_register`, `Kconfig`, `prj.conf` | Embedded (PlatformIO, ESP-IDF, Zephyr) |
| `*.ino` | Arduino |

A monorepo yields several stacks. Harvest each package separately and tag features with the package name.

## Entrypoint kinds

| Kind | Meaning |
| --- | --- |
| `http-route` | HTTP endpoint (REST) |
| `graphql-operation` | Query, Mutation, Subscription field with a resolver |
| `screen` | Navigable UI page or screen |
| `command` | CLI subcommand or console command |
| `job` | Scheduled or queued background work |
| `event` | Consumer of a message, webhook, topic, or signal |
| `task` | Long-running runtime task (RTOS task, daemon loop) |
| `isr` | Interrupt handler (embedded) |

## Web backends (http-route, graphql-operation)

| Framework | Signal | Grep |
| --- | --- | --- |
| Express, Koa, Hono | `router.<verb>(` / `app.<verb>(` | `\b(app|router)\.(get|post|put|patch|delete|all)\(` |
| Fastify | `fastify.route(`, `fastify.<verb>(` | `\.(route|get|post|put|patch|delete)\(` |
| NestJS | `@Get(`, `@Post(`, `@Controller(` | `@(Get|Post|Put|Patch|Delete|Controller)\(` |
| Next.js API / App Router | `app/**/route.ts`, `pages/api/**` | file paths |
| Remix / React Router v7 | `loader`, `action` exports in `routes/**` | `export (async )?function (loader|action)` |
| FastAPI | `@app.get(`, `@router.post(` | `@(app|router)\.(get|post|put|patch|delete)\(` |
| Flask | `@app.route(`, `@bp.route(` | `@\w+\.route\(` |
| Django | `urls.py` `path(` / `re_path(` | `\bpath\(|re_path\(` |
| Rails | `config/routes.rb` | `resources?|get|post|put|patch|delete|match` inside routes.rb |
| Go net/http, chi, gin, echo | `HandleFunc(`, `r.Get(`, `r.GET(`, `e.GET(` | `\.(HandleFunc|Get|GET|Post|POST|Put|PUT|Delete|DELETE|Patch|PATCH)\(` |
| ASP.NET | `[HttpGet]`, `MapGet(` | `\[Http(Get|Post|Put|Delete|Patch)\]|Map(Get|Post|Put|Delete|Patch)\(` |
| Spring | `@GetMapping`, `@RequestMapping` | `@(Get|Post|Put|Delete|Patch|Request)Mapping` |
| GraphQL (any) | schema `type Query { }`, `type Mutation { }` plus resolver map | `type (Query|Mutation|Subscription)` then resolver names |

Record for each hit: verb, path, handler symbol, `file:line`.

## Web frontends (screen)

| Framework | Signal |
| --- | --- |
| Next.js App Router | `app/**/page.tsx`; segment path is the route |
| Next.js Pages Router | `pages/**/*.tsx` excluding `_app`, `_document`, `api/` |
| Nuxt | `pages/**/*.vue` |
| SvelteKit | `src/routes/**/+page.svelte` |
| Remix / React Router v7 | `app/routes/**` or `routes.ts` config |
| React Router (manual) | `<Route path=` / `createBrowserRouter([` |
| Vue Router | `routes: [` with `path:` entries |
| Angular | `Routes = [` with `path:` entries |
| Feature-Sliced Design | each slice under `pages/` is a screen; `widgets/`, `features/`, `entities/` are modules, not entrypoints |

## Mobile and desktop (screen)

| Framework | Signal |
| --- | --- |
| React Native (React Navigation) | `<Stack.Screen name=`, `<Tab.Screen name=`, `createNativeStackNavigator` |
| Expo Router | `app/**/*.tsx` file routing |
| Flutter (GoRouter) | `GoRoute(path:` in router file |
| Flutter (Navigator) | `routes: {` map in `MaterialApp`, `onGenerateRoute` |
| SwiftUI | `struct X: View` reachable from `NavigationStack`, `TabView`, `.sheet`, `NavigationLink` |
| UIKit | storyboard scene IDs, `UIViewController` subclasses pushed via `pushViewController` |
| Jetpack Compose | `composable(route =` inside `NavHost` |
| Android Views | `<activity` in `AndroidManifest.xml`, `Fragment` subclasses in nav graph XML |
| Electron / Tauri | renderer routes as per web framework above; `ipcMain.handle(` channels are `command` kind |

## CLI (command)

| Library | Signal |
| --- | --- |
| commander, yargs, oclif | `.command(`, `yargs.command(`, `src/commands/**` |
| clap (Rust) | `#[command]`, `#[derive(Subcommand)]` enum variants |
| cobra (Go) | `&cobra.Command{ Use:` |
| click, typer, argparse | `@cli.command(`, `@app.command(`, `add_parser(` |
| Thor, Rake | `desc` + method, `task :name` |

## Jobs and queues (job)

| Library | Signal |
| --- | --- |
| BullMQ / Bull | `new Worker('<queue>'`, `new Queue('<queue>'`, `queue.process(` |
| Celery | `@app.task`, `@shared_task`, `beat_schedule` |
| Sidekiq / ActiveJob | `include Sidekiq::Job`, `class X < ApplicationJob` |
| cron files | `crontab`, `schedule.yml`, `vercel.json` `crons`, GitHub Actions `schedule:` |
| node-cron / APScheduler | `cron.schedule(`, `scheduler.add_job(` |
| Cloud functions | `functions.pubsub.schedule(`, `serverless.yml` `schedule:` |

## Events and messaging (event)

| Mechanism | Signal |
| --- | --- |
| Kafka | `consumer.subscribe(`, `@KafkaListener` |
| SQS / SNS | `ReceiveMessage`, handler registered for queue ARN |
| Pub/Sub | `subscription.on('message'`, `onMessagePublished(` |
| Webhooks | route whose path contains `webhook` or verifies a signature header |
| EventEmitter / domain events | `emitter.on('<event>'`, `@OnEvent(`, `subscribe(<EventClass>)` |
| MQTT | `esp_mqtt_client_subscribe(`, `client.subscribe(` |

## Embedded and firmware (task, command, event)

| Mechanism | Signal | Kind |
| --- | --- | --- |
| FreeRTOS | `xTaskCreate(`, `xTaskCreatePinnedToCore(` | `task` |
| Zephyr | `K_THREAD_DEFINE(`, `k_thread_create(` | `task` |
| Arduino | `setup()` and `loop()`; each top-level branch in `loop()` is a candidate feature | `task` |
| Interrupts | `ISR(`, `attachInterrupt(`, `IRQ_CONNECT(`, `_IRQHandler` | `isr` |
| Serial / console commands | command table arrays (`{"name", handler}`), `esp_console_cmd_register(`, `SHELL_CMD_REGISTER(` | `command` |
| MQTT / BLE / CAN | `subscribe(`, GATT characteristic write callbacks, CAN ID switch cases | `event` |
| Compile-time switches | `#ifdef CONFIG_*`, `#if FEATURE_*`, `sdkconfig`, `prj.conf`, `build_flags` in `platformio.ini` | flag, provider `kconfig` or `preprocessor` |

No dependency graph tool is standard here. Follow `#include` chains two levels and tag module attribution `INFERRED`.

## Deterministic extractors

Run when available; parse the output instead of grepping imports.

| Stack | Command | Output |
| --- | --- | --- |
| JS / TS | `npx dependency-cruiser --output-type json <src>` | module graph with `dependencies[]` per file |
| Python | `pydeps <pkg> --show-deps --no-output` | JSON import graph |
| Go | `go list -json ./...` | `Imports` per package |
| Rust | `cargo metadata --format-version 1` | crate graph (coarse) |
| Dart | `dart pub deps --json` | package deps only (coarse) |
| .NET | `dotnet list reference` per project | project deps only (coarse) |

Check the tool is installed (`npx --no-install`, `which`) before running. Never install a dependency to build the map; fall back to grep.

## Layer detection heuristics

Prefer Feature-Sliced Design names when the folders exist (`app`, `pages`, `widgets`, `features`, `entities`, `shared`). Otherwise assign layers by path segment:

| Layer label | Path segments |
| --- | --- |
| `ui` | `ui`, `components`, `views`, `screens`, `pages`, `widgets`, `presentation` |
| `api` | `api`, `routes`, `controllers`, `handlers`, `resolvers`, `endpoints` |
| `domain` | `domain`, `model`, `models`, `entities`, `store`, `state`, `services`, `usecases` |
| `lib` | `lib`, `utils`, `helpers`, `hooks`, `common` |
| `infra` | `infra`, `db`, `repositories`, `adapters`, `clients`, `drivers`, `hal` |
| `config` | `config`, `settings`, `env` |

Record the chosen layer names in the `layers:` line of the meta comment so later runs reuse them.
