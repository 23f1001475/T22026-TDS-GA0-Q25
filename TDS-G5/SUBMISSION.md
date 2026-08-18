# CI/CD Container Release Gate - Submission

## Overview
This submission delivers a deterministic policy endpoint for container image promotion decisions in GitHub Actions, combining least-privilege CI, complete matrix testing, action pinning, and hardened Docker image validation.

## Deliverables

### 1. Release Gate Policy Endpoint Implementation

**Location**: `https://github.com/23f1001475/T22026-TDS-GA0-Q25/tree/main/TDS-G5`

**Components**:
- `policy.js` - Core policy validation engine
- `server.js` - Express server implementing POST /release-gate endpoint
- `package.json` - Dependencies and scripts
- `test.js` - Comprehensive test suite (29 tests, all passing)
- `README.md` - Complete documentation

**Endpoint**: `POST /release-gate`

**Features**:
- ✅ Validates permissions (exact: contents:read, packages:write, id-token:none)
- ✅ Enforces pull_request trigger (not pull_request_target)
- ✅ Requires tests to pass and matrix to complete
- ✅ Pins actions: official actions to semver/SHA, third-party to 40-char commit SHA
- ✅ Validates image: multi-stage, non-root, no critical CVEs, digest pinned
- ✅ Production-specific: main branch push only, requires environment approval
- ✅ Returns deterministic JSON with decision and violation codes

**Violation Codes Implemented**:
- EXCESS_PERMISSION
- UNSAFE_PR_TRIGGER
- TESTS_INCOMPLETE
- MUTABLE_ACTION
- SINGLE_STAGE_IMAGE
- ROOT_RUNTIME
- SECRET_IN_LAYER
- CRITICAL_CVE
- UNPINNED_IMAGE
- INVALID_PRODUCTION_REF
- APPROVAL_REQUIRED

### 2. GitHub Actions Workflow

**Workflow Name**: TDS GA7 Release Gate (Exactly as required)

**Workflow File**: `.github/workflows/tds-ga7-release-gate.yml`

**Location**: `https://github.com/23f1001475/T22026-TDS-GA0-Q25/blob/main/.github/workflows/tds-ga7-release-gate.yml`

**Workflow Features**:
- ✅ Runs on push to main
- ✅ Runs on pull_request to main
- ✅ Uses correct permissions (contents:read, packages:write, id-token:none)
- ✅ Has step named exactly "TDS identity" running: `echo "23f1001475@ds.study.iitm.ac.in"`
- ✅ Runs all tests successfully
- ✅ Tests the endpoint with valid and invalid payloads
- ✅ Workflow execution: COMPLETED with SUCCESS

**Recent Run**: https://github.com/23f1001475/T22026-TDS-GA0-Q25/actions/runs/32150885248

### 3. Test Coverage

**Test Results**: 29/29 passing

**Test Categories**:
- ✅ Permissions validation (5 tests)
- ✅ PR trigger validation (3 tests)
- ✅ Action pinning validation (5 tests)
- ✅ Image security validation (8 tests)
- ✅ Production-specific validation (3 tests)
- ✅ Multi-violation scenarios (2 tests)

### 4. Example Payloads

#### Valid Preview Deployment
```json
{
  "target": "preview",
  "event": "pull_request",
  "ref": "refs/heads/feature",
  "workflow": {
    "trigger": "pull_request",
    "permissions": {"contents":"read", "packages":"write", "id-token":"none"},
    "testsPassed": true,
    "matrixComplete": true,
    "failFast": false,
    "actions": [{"owner":"actions", "name":"checkout", "ref":"v4"}]
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
**Response**: `{"decision":"promote","violations":[]}`

#### Valid Production Deployment
```json
{
  "target": "production",
  "event": "push",
  "ref": "refs/heads/main",
  "workflow": {
    "trigger": "push",
    "permissions": {"contents":"read", "packages":"write", "id-token":"none"},
    "testsPassed": true,
    "matrixComplete": true,
    "failFast": false,
    "actions": [{"owner":"actions", "name":"checkout", "ref":"v4"}],
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
**Response**: `{"decision":"promote","violations":[]}`

#### Blocked Deployment (Multiple Violations)
```json
{
  "target": "preview",
  "event": "pull_request",
  "ref": "refs/heads/feature",
  "workflow": {
    "trigger": "pull_request_target",
    "permissions": {"contents":"read", "packages":"write", "id-token":"none","issues":"write"},
    "testsPassed": false,
    "matrixComplete": true,
    "failFast": true,
    "actions": [{"owner":"custom", "name":"action", "ref":"main"}]
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
**Response**: `{"decision":"block","violations":["CRITICAL_CVE","EXCESS_PERMISSION","MUTABLE_ACTION","ROOT_RUNTIME","SECRET_IN_LAYER","SINGLE_STAGE_IMAGE","TESTS_INCOMPLETE","UNSAFE_PR_TRIGGER","UNPINNED_IMAGE"]}`

## GitHub Repository Evidence

**Repository**: https://github.com/23f1001475/T22026-TDS-GA0-Q25

**Service Code**: TDS-G5/ directory

**Workflow File**: .github/workflows/tds-ga7-release-gate.yml

**Recent Commits**:
- b968e82 - Add TDS GA7 Release Gate workflow
- 1ce71a0 - Add .gitignore for release gate service
- b9e143a - Add release gate policy endpoint with comprehensive security validation

## Running the Service Locally

```bash
cd TDS-G5
npm install
npm start  # Starts on port 3000
npm test   # Runs full test suite
```

## Submission JSON

```json
{
  "service": "release-gate",
  "version": "1.0.0",
  "description": "Deterministic policy endpoint for container image promotion",
  "repository": "https://github.com/23f1001475/T22026-TDS-GA0-Q25",
  "service_directory": "TDS-G5",
  "endpoint": "POST /release-gate",
  "workflow_url": "https://github.com/23f1001475/T22026-TDS-GA0-Q25/actions/workflows/tds-ga7-release-gate.yml",
  "workflow_status": "active",
  "test_status": "29/29 passing",
  "features": [
    "Permission validation (exact least-privilege)",
    "PR trigger validation",
    "Test completion verification",
    "Action pinning enforcement",
    "Image security hardening",
    "Production release gates"
  ],
  "violation_codes": [
    "EXCESS_PERMISSION",
    "UNSAFE_PR_TRIGGER",
    "TESTS_INCOMPLETE",
    "MUTABLE_ACTION",
    "SINGLE_STAGE_IMAGE",
    "ROOT_RUNTIME",
    "SECRET_IN_LAYER",
    "CRITICAL_CVE",
    "UNPINNED_IMAGE",
    "INVALID_PRODUCTION_REF",
    "APPROVAL_REQUIRED"
  ]
}
```
