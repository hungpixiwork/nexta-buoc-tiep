/**
 * Base Domain Error class and specific domain error categories.
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with ID '${id}' was not found`, 'NOT_FOUND_ERROR', { entityName, id });
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', details);
  }
}

export class DomainRuleViolation extends DomainError {
  constructor(ruleName: string, message: string, details?: Record<string, unknown>) {
    super(`Rule '${ruleName}' violated: ${message}`, 'DOMAIN_RULE_VIOLATION', { ruleName, ...details });
  }
}

export class ResourceStaleError extends DomainError {
  constructor(resourceId: string, lastVerifiedAt: string) {
    super(`Resource '${resourceId}' is stale (last verified: ${lastVerifiedAt})`, 'RESOURCE_STALE', { resourceId, lastVerifiedAt });
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(fromState: string, toState: string, entityName: string) {
    super(`Invalid transition from '${fromState}' to '${toState}' for ${entityName}`, 'INVALID_TRANSITION', { fromState, toState, entityName });
  }
}

export class SafeguardingEscalationRequired extends DomainError {
  constructor(reason: string, details?: Record<string, unknown>) {
    super(`Safeguarding escalation required: ${reason}`, 'SAFEGUARDING_ESCALATION_REQUIRED', details);
  }
}
