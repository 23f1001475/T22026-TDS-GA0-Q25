const { validateReleaseGate } = require('./policy');

// Test helpers
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  ${error.message}`);
    testsFailed++;
  }
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
    );
  }
}

// Safe valid payload template
const validPayload = {
  target: 'preview',
  event: 'pull_request',
  ref: 'refs/heads/feature',
  workflow: {
    trigger: 'pull_request',
    permissions: { contents: 'read', packages: 'write', 'id-token': 'none' },
    testsPassed: true,
    matrixComplete: true,
    failFast: false,
    actions: [{ owner: 'actions', name: 'checkout', ref: 'v4' }]
  },
  image: {
    multiStage: true,
    runsAsRoot: false,
    secretMode: 'none',
    criticalVulnerabilities: 0,
    digestPinned: true
  }
};

// Permissions tests
test('Accept valid permissions (exact match)', () => {
  const result = validateReleaseGate(validPayload);
  assertEquals(result.violations.includes('EXCESS_PERMISSION'), false, 'Should not have EXCESS_PERMISSION');
});

test('Reject missing contents:read', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.permissions = { packages: 'write', 'id-token': 'none' };
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('EXCESS_PERMISSION'), true, 'Should have EXCESS_PERMISSION');
});

test('Reject missing packages:write', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.permissions = { contents: 'read', 'id-token': 'none' };
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('EXCESS_PERMISSION'), true, 'Should have EXCESS_PERMISSION');
});

test('Reject missing id-token:none', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.permissions = { contents: 'read', packages: 'write' };
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('EXCESS_PERMISSION'), true, 'Should have EXCESS_PERMISSION');
});

test('Reject extra permissions', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.permissions = {
    contents: 'read',
    packages: 'write',
    'id-token': 'none',
    issues: 'write'
  };
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('EXCESS_PERMISSION'), true, 'Should have EXCESS_PERMISSION');
});

// PR trigger tests
test('Accept pull_request trigger for PR events', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.event = 'pull_request';
  payload.workflow.trigger = 'pull_request';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('UNSAFE_PR_TRIGGER'), false, 'Should not have UNSAFE_PR_TRIGGER');
});

test('Reject pull_request_target trigger for PR events', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.event = 'pull_request';
  payload.workflow.trigger = 'pull_request_target';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('UNSAFE_PR_TRIGGER'), true, 'Should have UNSAFE_PR_TRIGGER');
});

test('Reject failed tests', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.testsPassed = false;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('TESTS_INCOMPLETE'), true, 'Should have TESTS_INCOMPLETE');
});

test('Reject incomplete matrix', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.matrixComplete = false;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('TESTS_INCOMPLETE'), true, 'Should have TESTS_INCOMPLETE');
});

test('Reject failFast enabled', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.failFast = true;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('TESTS_INCOMPLETE'), true, 'Should have TESTS_INCOMPLETE');
});

// Action pinning tests
test('Accept official actions with semver tags', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.actions = [
    { owner: 'actions', name: 'checkout', ref: 'v4' },
    { owner: 'actions', name: 'setup-node', ref: 'v3.6.0' }
  ];
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('MUTABLE_ACTION'), false, 'Should not have MUTABLE_ACTION');
});

test('Accept official actions with full commit SHA', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.actions = [
    { owner: 'actions', name: 'checkout', ref: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' }
  ];
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('MUTABLE_ACTION'), false, 'Should not have MUTABLE_ACTION');
});

test('Accept third-party actions with full commit SHA', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.actions = [
    { owner: 'myorg', name: 'custom', ref: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' }
  ];
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('MUTABLE_ACTION'), false, 'Should not have MUTABLE_ACTION');
});

test('Reject third-party actions without commit SHA', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.actions = [
    { owner: 'myorg', name: 'custom', ref: 'main' }
  ];
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('MUTABLE_ACTION'), true, 'Should have MUTABLE_ACTION');
});

test('Reject official actions with branch ref', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.workflow.actions = [
    { owner: 'actions', name: 'checkout', ref: 'main' }
  ];
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('MUTABLE_ACTION'), true, 'Should have MUTABLE_ACTION');
});

// Image security tests
test('Reject single-stage images', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.multiStage = false;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('SINGLE_STAGE_IMAGE'), true, 'Should have SINGLE_STAGE_IMAGE');
});

test('Reject root runtime', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.runsAsRoot = true;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('ROOT_RUNTIME'), true, 'Should have ROOT_RUNTIME');
});

test('Accept no secrets', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.secretMode = 'none';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('SECRET_IN_LAYER'), false, 'Should not have SECRET_IN_LAYER');
});

test('Accept BuildKit secrets', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.secretMode = 'buildkit';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('SECRET_IN_LAYER'), false, 'Should not have SECRET_IN_LAYER');
});

test('Reject secrets in layer (arg)', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.secretMode = 'arg';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('SECRET_IN_LAYER'), true, 'Should have SECRET_IN_LAYER');
});

test('Reject secrets in layer (copy)', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.secretMode = 'copy';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('SECRET_IN_LAYER'), true, 'Should have SECRET_IN_LAYER');
});

test('Reject critical CVEs', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.criticalVulnerabilities = 5;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('CRITICAL_CVE'), true, 'Should have CRITICAL_CVE');
});

test('Reject unpinned images', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.digestPinned = false;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('UNPINNED_IMAGE'), true, 'Should have UNPINNED_IMAGE');
});

// Production-specific tests
test('Reject non-main ref for production', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.target = 'production';
  payload.event = 'push';
  payload.ref = 'refs/heads/develop';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('INVALID_PRODUCTION_REF'), true, 'Should have INVALID_PRODUCTION_REF');
});

test('Reject pull_request event for production', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.target = 'production';
  payload.event = 'pull_request';
  payload.ref = 'refs/heads/main';
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('INVALID_PRODUCTION_REF'), true, 'Should have INVALID_PRODUCTION_REF');
});

test('Reject production without approval', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.target = 'production';
  payload.event = 'push';
  payload.ref = 'refs/heads/main';
  payload.workflow.environmentApproval = false;
  const result = validateReleaseGate(payload);
  assertEquals(result.violations.includes('APPROVAL_REQUIRED'), true, 'Should have APPROVAL_REQUIRED');
});

test('Accept production with all requirements', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.target = 'production';
  payload.event = 'push';
  payload.ref = 'refs/heads/main';
  payload.workflow.environmentApproval = true;
  const result = validateReleaseGate(payload);
  assertEquals(result.decision, 'promote', 'Should promote');
  assertEquals(result.violations.length, 0, 'Should have no violations');
});

// Combined violation tests
test('Accept valid preview deployment', () => {
  const result = validateReleaseGate(validPayload);
  assertEquals(result.decision, 'promote', 'Should promote');
  assertEquals(result.violations.length, 0, 'Should have no violations');
});

test('Block multiple violations', () => {
  const payload = JSON.parse(JSON.stringify(validPayload));
  payload.image.multiStage = false;
  payload.image.runsAsRoot = true;
  payload.image.digestPinned = false;
  payload.image.criticalVulnerabilities = 2;
  const result = validateReleaseGate(payload);
  assertEquals(result.decision, 'block', 'Should block');
  assertEquals(result.violations.includes('SINGLE_STAGE_IMAGE'), true, 'Should have SINGLE_STAGE_IMAGE');
  assertEquals(result.violations.includes('ROOT_RUNTIME'), true, 'Should have ROOT_RUNTIME');
  assertEquals(result.violations.includes('UNPINNED_IMAGE'), true, 'Should have UNPINNED_IMAGE');
  assertEquals(result.violations.includes('CRITICAL_CVE'), true, 'Should have CRITICAL_CVE');
});

// Print results
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`${'='.repeat(50)}\n`);

process.exit(testsFailed > 0 ? 1 : 0);
