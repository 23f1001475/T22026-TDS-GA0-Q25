/**
 * Release Gate Policy Engine
 * Validates GitHub Actions runs and container images for promotion
 */

const sha256Regex = /^[a-f0-9]{40}$/;
const semverTagRegex = /^v?\d+(\.\d+)*$/;

function validateReleaseGate(payload) {
  const violations = [];

  // Validate permissions (must be exactly: contents:read, packages:write, id-token:none)
  const perms = payload.workflow.permissions || {};
  if (perms.contents !== 'read') violations.push('EXCESS_PERMISSION');
  if (perms.packages !== 'write') violations.push('EXCESS_PERMISSION');
  if (perms['id-token'] !== 'none') violations.push('EXCESS_PERMISSION');
  if (Object.keys(perms).length !== 3) violations.push('EXCESS_PERMISSION');

  // Validate PR trigger (must use pull_request, not pull_request_target)
  if (payload.event === 'pull_request') {
    if (payload.workflow.trigger !== 'pull_request') {
      violations.push('UNSAFE_PR_TRIGGER');
    }
    if (!payload.workflow.testsPassed) {
      violations.push('TESTS_INCOMPLETE');
    }
    if (!payload.workflow.matrixComplete) {
      violations.push('TESTS_INCOMPLETE');
    }
    if (payload.workflow.failFast) {
      violations.push('TESTS_INCOMPLETE');
    }
  }

  // Validate actions are pinned correctly
  if (payload.workflow.actions && Array.isArray(payload.workflow.actions)) {
    for (const action of payload.workflow.actions) {
      const isOfficialAction = action.owner === 'actions';
      const isSemverTag = semverTagRegex.test(action.ref);
      const isCommitSha = sha256Regex.test(action.ref);
      
      if (isOfficialAction) {
        // Official actions can use version tags or commit SHAs
        if (!isSemverTag && !isCommitSha) {
          violations.push('MUTABLE_ACTION');
        }
      } else {
        // Third-party actions must be pinned to full commit SHA only
        if (!isCommitSha) {
          violations.push('MUTABLE_ACTION');
        }
      }
    }
  }

  // Validate image security
  if (!payload.image.multiStage) {
    violations.push('SINGLE_STAGE_IMAGE');
  }
  if (payload.image.runsAsRoot) {
    violations.push('ROOT_RUNTIME');
  }
  if (
    payload.image.secretMode !== 'none' &&
    payload.image.secretMode !== 'buildkit'
  ) {
    violations.push('SECRET_IN_LAYER');
  }
  if (payload.image.criticalVulnerabilities > 0) {
    violations.push('CRITICAL_CVE');
  }
  if (!payload.image.digestPinned) {
    violations.push('UNPINNED_IMAGE');
  }

  // Production-specific validation
  if (payload.target === 'production') {
    if (payload.event !== 'push' || payload.ref !== 'refs/heads/main') {
      violations.push('INVALID_PRODUCTION_REF');
    }
    if (!payload.workflow.environmentApproval) {
      violations.push('APPROVAL_REQUIRED');
    }
  }

  // Remove duplicates and sort for consistency
  const uniqueViolations = [...new Set(violations)].sort();

  return {
    decision: uniqueViolations.length === 0 ? 'promote' : 'block',
    violations: uniqueViolations
  };
}

module.exports = { validateReleaseGate };
