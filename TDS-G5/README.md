# Release Gate Policy Endpoint

A deterministic policy endpoint that decides whether a GitHub Actions run may promote a container image. This combines least-privilege CI, complete matrix testing, action pinning, and hardened Docker images into one security-focused release gate.

## Endpoint

### POST /release-gate

Validates a release promotion request against security policies.

#### Request Body

```json
{
  "target": "preview | production",
  "event": "pull_request | push",
  "ref": "refs/heads/...",
  "workflow": {
    "trigger": "pull_request | pull_request_target | push",
    "permissions": {
      "contents": "read",
      "packages": "write",
      "id-token": "none"
    },
    "testsPassed": true,
    "matrixComplete": true,
    "failFast": false,
    "actions": [
      {
        "owner": "actions | custom",
        "name": "action-name",
        "ref": "v4 | a1b2c3d4..."
      }
    ],
    "environmentApproval": true
  },
  "image": {
    "multiStage": true,
    "runsAsRoot": false,
    "secretMode": "none | buildkit | arg | copy",
    "criticalVulnerabilities": 0,
    "digestPinned": true
  }
}
```

#### Response

```json
{
  "decision": "promote | block",
  "violations": [
    "CODE1",
    "CODE2"
  ]
}
```

## Policy Rules

### Permission Validation
- **EXCESS_PERMISSION**: Permissions must be exactly `contents: read`, `packages: write`, and `id-token: none`. No additional scopes allowed.

### Pull Request Validation
- **UNSAFE_PR_TRIGGER**: Pull requests must use `pull_request` trigger, never `pull_request_target`.
- **TESTS_INCOMPLETE**: For pull requests, tests must pass, matrix must complete, and `failFast` must be false.

### Action Pinning
- **MUTABLE_ACTION**: 
  - Official actions (owner: "actions") may use semver tags (v4, v3.6.0, etc.) or commit SHAs.
  - Third-party actions must be pinned to full 40-character lowercase hexadecimal commit SHA.

### Image Security
- **SINGLE_STAGE_IMAGE**: Image must be multi-stage.
- **ROOT_RUNTIME**: Image must run as non-root user.
- **SECRET_IN_LAYER**: Only `none` or `buildkit` secret modes allowed. `arg` and `copy` are not allowed.
- **CRITICAL_CVE**: Zero critical vulnerabilities required.
- **UNPINNED_IMAGE**: Image must be referenced by digest (SHA256), not by mutable tag.

### Production-Specific
- **INVALID_PRODUCTION_REF**: Production requires `push` event to `refs/heads/main`.
- **APPROVAL_REQUIRED**: Production requires `environmentApproval: true`.

## Running

### Install Dependencies
```bash
npm install
```

### Start Server
```bash
npm start
# Server runs on http://localhost:3000
```

### Run Tests
```bash
npm test
```

### Test Endpoint
```bash
curl -X POST http://localhost:3000/release-gate \
  -H "Content-Type: application/json" \
  -d @payload.json
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Example Payloads

### Valid Preview Deployment
```json
{
  "target": "preview",
  "event": "pull_request",
  "ref": "refs/heads/feature",
  "workflow": {
    "trigger": "pull_request",
    "permissions": {
      "contents": "read",
      "packages": "write",
      "id-token": "none"
    },
    "testsPassed": true,
    "matrixComplete": true,
    "failFast": false,
    "actions": [
      {
        "owner": "actions",
        "name": "checkout",
        "ref": "v4"
      }
    ]
  },
  "image": {
    "multiStage": true,
    "runsAsRoot": false,
    "secretMode": "none",
    "criticalVulnerabilities": 0,
    "digestPinned": true
  }
}
```

Response: `{"decision":"promote","violations":[]}`

### Valid Production Deployment
```json
{
  "target": "production",
  "event": "push",
  "ref": "refs/heads/main",
  "workflow": {
    "trigger": "push",
    "permissions": {
      "contents": "read",
      "packages": "write",
      "id-token": "none"
    },
    "testsPassed": true,
    "matrixComplete": true,
    "failFast": false,
    "actions": [
      {
        "owner": "actions",
        "name": "checkout",
        "ref": "v4"
      }
    ],
    "environmentApproval": true
  },
  "image": {
    "multiStage": true,
    "runsAsRoot": false,
    "secretMode": "buildkit",
    "criticalVulnerabilities": 0,
    "digestPinned": true
  }
}
```

Response: `{"decision":"promote","violations":[]}`

### Invalid - Multiple Violations
```json
{
  "target": "preview",
  "event": "pull_request",
  "ref": "refs/heads/feature",
  "workflow": {
    "trigger": "pull_request_target",
    "permissions": {
      "contents": "read",
      "packages": "write",
      "id-token": "none",
      "issues": "write"
    },
    "testsPassed": false,
    "matrixComplete": true,
    "failFast": true,
    "actions": [
      {
        "owner": "custom",
        "name": "action",
        "ref": "main"
      }
    ]
  },
  "image": {
    "multiStage": false,
    "runsAsRoot": true,
    "secretMode": "copy",
    "criticalVulnerabilities": 3,
    "digestPinned": false
  }
}
```

Response:
```json
{
  "decision": "block",
  "violations": [
    "CRITICAL_CVE",
    "EXCESS_PERMISSION",
    "MUTABLE_ACTION",
    "ROOT_RUNTIME",
    "SECRET_IN_LAYER",
    "SINGLE_STAGE_IMAGE",
    "TESTS_INCOMPLETE",
    "UNSAFE_PR_TRIGGER",
    "UNPINNED_IMAGE"
  ]
}
```

## Violation Codes

| Code | Meaning |
|------|---------|
| EXCESS_PERMISSION | Wrong permissions scope |
| UNSAFE_PR_TRIGGER | Using pull_request_target instead of pull_request |
| TESTS_INCOMPLETE | Tests not passing, matrix incomplete, or failFast enabled |
| MUTABLE_ACTION | Action not pinned to commit SHA (for third-party) or semver/SHA (for official) |
| SINGLE_STAGE_IMAGE | Image must be multi-stage |
| ROOT_RUNTIME | Image runs as root |
| SECRET_IN_LAYER | Secrets embedded in layers (only none/buildkit allowed) |
| CRITICAL_CVE | Critical vulnerabilities detected |
| UNPINNED_IMAGE | Image not referenced by digest |
| INVALID_PRODUCTION_REF | Production requires main branch push |
| APPROVAL_REQUIRED | Production requires environment approval |

## License

MIT
