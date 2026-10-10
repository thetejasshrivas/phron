# PH-24 dependency disposition — 2026-10-10 IST

Pinned package-lock.json unchanged. Node24.21/npm11.19; Next16.3.8; Jest30.5.2. Base commit caec5424b5e44b4de3f3fdff7259ffbf17a673c2 plus the PH24 remediation diff. No install, force fix, override, downgrade or dependency patch was performed.

## Executed audit

- `npm audit --json`: exit1, 24 affected package entries (5 high,19 moderate,0 critical), rooted in **two** advisories. Raw command output and parsed JSON are in remediation/dependency-audit.log and dependency-audit.json. npm's trailing diagnostic was retained in the raw log when extracting valid JSON.
- `npm audit --omit=dev --json`: exit0, **zero** advisory entries for the production dependency closure. Evidence: remediation/dependency-production-audit.json/log. This classifies the installed tree; it is not a guarantee that deployed bundles contain no vulnerable code.
- `npm ls braces argparse js-yaml micromatch fast-glob --all` and `npm ls sprintf-js --all`: exit0; exact paths recorded in remediation/dependency-paths.log and sprintf-paths.log.
- Source/config inspection: application src and scripts do not import braces, fast-glob, micromatch, argparse, js-yaml or sprintf-js. ESLint uses pinned Next preset and trusted repository config; Jest uses committed test/config inputs. This is a reachability assessment, not an exhaustive proof against every bundler/tool path.

## Root risk assessments and nonbreaking dispositions

| Root | Installed path and risk | Current disposition |
| --- | --- | --- |
| braces3.0.3 / high / CVE-2026-93687 | eslint-config-next16.3.8 → @next/eslint-plugin-next16.3.8 → fast-glob3.3.1 → micromatch4.0.8 → braces3.0.3. Deep attacker-controlled glob nesting can crash Node's recursive walkers. Five high entries reflect propagation, not five independent flaws. | Retain pinned stack; allow lint/build only with reviewed repository glob/config inputs. Do not evaluate capture text as a glob/config or run untrusted PR configuration with privileged credentials. No web-input path was found. Residual developer/CI denial-of-service exposure remains; track an upstream compatible patch before general release. |
| sprintf-js1.0.3 / moderate / CVE-2026-97058 | Jest30.5.2 → @jest/core/@jest/transform → babel-plugin-istanbul → @istanbuljs/load-nyc-config → js-yaml3.15.2 → argparse1.0.10 → sprintf-js1.0.3. Attacker-controlled precision format strings can abort the calling operation. Nineteen moderate entries propagate through the test/config stack. | Keep configuration/test format strings trusted and review new tooling configuration. Do not introduce a path from capture text or model output to printf-style format strings. Residual local test-tooling availability risk remains; monitor a compatible upstream fix. |

Current reviewed sources list **no patched version** for either root: [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), checked2026-10-10. npm proposes eslint-config-next14.2.35 and Jest25.0.0 as major-version changes. Those incompatible downgrades are not a supported remediation for this pinned Next16/Jest30 stack and were not executed.

PH24-DEP-01 disposition is **DOCUMENTED / deferred upstream patch with trusted-tooling controls**; vulnerabilities remain installed and npm audit still exits1. This is an engineering risk assessment, not founder acceptance of a release exception. G5/G0B/V3 and release approval remain open. Reassess when upstream patches become available or tooling starts accepting untrusted configurations; do not claim the tree is vulnerability-free.

## All affected package entries

| Package | Severity | Position | Via |
| --- | --- | --- | --- |
| @istanbuljs/load-nyc-config | moderate | transitive dev | js-yaml |
| @jest/core | moderate | transitive dev | @jest/reporters, @jest/transform, jest-config, jest-resolve-dependencies, jest-runner, jest-runtime, jest-snapshot |
| @jest/expect | moderate | transitive dev | jest-snapshot |
| @jest/globals | moderate | direct dev | @jest/expect |
| @jest/reporters | moderate | transitive dev | @jest/transform |
| @jest/transform | moderate | transitive dev | babel-plugin-istanbul |
| @next/eslint-plugin-next | high | transitive dev | fast-glob |
| argparse | moderate | transitive dev | sprintf-js |
| babel-jest | moderate | transitive dev | @jest/transform, babel-plugin-istanbul |
| babel-plugin-istanbul | moderate | transitive dev | @istanbuljs/load-nyc-config |
| braces | high | transitive dev | braces |
| eslint-config-next | high | direct dev | @next/eslint-plugin-next |
| fast-glob | high | transitive dev | micromatch |
| jest | moderate | direct dev | @jest/core, jest-cli |
| jest-circus | moderate | transitive dev | @jest/expect, jest-runtime, jest-snapshot |
| jest-cli | moderate | transitive dev | @jest/core, jest-config |
| jest-config | moderate | transitive dev | babel-jest, jest-circus, jest-runner |
| jest-resolve-dependencies | moderate | transitive dev | jest-snapshot |
| jest-runner | moderate | transitive dev | @jest/transform, jest-runtime |
| jest-runtime | moderate | transitive dev | @jest/globals, @jest/transform, jest-snapshot |
| jest-snapshot | moderate | transitive dev | @jest/transform |
| js-yaml | moderate | transitive dev | argparse |
| micromatch | high | transitive dev | braces |
| sprintf-js | moderate | transitive dev | sprintf-js |
