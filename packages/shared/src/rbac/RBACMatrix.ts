/**
 * RBACMatrix.ts
 * Single Source of Truth for Role-Based Access Control (RBAC) Matrix (Section 42 NEXTA PDR).
 * 
 * Actors:
 * - NAVIGATOR: Youth field worker (assigned cases, intake, basic consent, own referrals)
 * - COORDINATOR: Operational supervisor (case assignment, resources, partner capacity, analytics)
 * - SAFEGUARDING_REVIEWER: Specialized officer for child cases, high-risk flags, mandatory escalations
 * - PARTNER: External service provider (assigned referrals minimum data, capacity updates)
 * - ADMIN: Infrastructure & pilot configurations (no direct PII access without audit)
 * - PUBLIC: Unauthenticated judge/public user (anonymized metrics, evidence, demo only)
 */

export type CanonicalActorRole =
  | 'NAVIGATOR'
  | 'COORDINATOR'
  | 'SAFEGUARDING_REVIEWER'
  | 'PARTNER'
  | 'ADMIN'
  | 'PUBLIC';

export type ProtectedResourceType =
  | 'ASSIGNED_CASE'
  | 'PII'
  | 'REFERRAL'
  | 'RESOURCE'
  | 'SAFEGUARDING'
  | 'AUDIT'
  | 'METRICS';

export type PermissionAction = 'READ' | 'WRITE' | 'CREATE' | 'DELETE' | 'ESCALATE' | 'APPROVE' | 'AUDIT_VIEW';

export interface RBACContext {
  actorId?: string;
  actorRole: CanonicalActorRole | string;
  caseOwnerId?: string;
  referralPartnerId?: string;
  actorPartnerId?: string;
  isChildCase?: boolean;
  isHighRisk?: boolean;
}

export interface AccessEvaluation {
  granted: boolean;
  reason?: string;
  dataClassification: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'MINIMUM_NECESSARY';
}

export class RBACMatrix {
  /**
   * Evaluates whether an actor with a specific role and context can access a resource.
   */
  public static evaluateAccess(
    resource: ProtectedResourceType,
    action: PermissionAction,
    context: RBACContext
  ): AccessEvaluation {
    const role = this.normalizeRole(context.actorRole);

    switch (resource) {
      case 'ASSIGNED_CASE': {
        if (role === 'ADMIN' || role === 'COORDINATOR') {
          return { granted: true, dataClassification: 'CONFIDENTIAL' };
        }
        if (role === 'NAVIGATOR') {
          if (!context.caseOwnerId || context.actorId === context.caseOwnerId) {
            return { granted: true, dataClassification: 'CONFIDENTIAL' };
          }
          return { granted: false, reason: 'Navigator chỉ được truy cập các ca được phân công.', dataClassification: 'CONFIDENTIAL' };
        }
        if (role === 'SAFEGUARDING_REVIEWER') {
          if (context.isChildCase || context.isHighRisk) {
            return { granted: true, dataClassification: 'CONFIDENTIAL' };
          }
          return { granted: true, dataClassification: 'RESTRICTED' };
        }
        if (role === 'PARTNER' || role === 'PUBLIC') {
          return { granted: false, reason: 'Đối tác và Công chúng không được truy cập hồ sơ ca đầy đủ.', dataClassification: 'RESTRICTED' };
        }
        return { granted: false, reason: 'Không có quyền truy cập.', dataClassification: 'RESTRICTED' };
      }

      case 'PII': {
        if (role === 'PUBLIC') {
          return { granted: false, reason: 'TUYỆT ĐỐI KHÔNG để lộ PII ra ngoài môi trường công cộng.', dataClassification: 'CONFIDENTIAL' };
        }
        if (role === 'PARTNER') {
          // Partner only gets minimum necessary data (e.g. Alias name, phone if consented)
          if (action === 'READ') {
            return { granted: true, dataClassification: 'MINIMUM_NECESSARY' };
          }
          return { granted: false, reason: 'Đối tác không được phép chỉnh sửa PII.', dataClassification: 'MINIMUM_NECESSARY' };
        }
        if (role === 'ADMIN') {
          return { granted: true, dataClassification: 'CONFIDENTIAL' };
        }
        return { granted: true, dataClassification: 'RESTRICTED' };
      }

      case 'REFERRAL': {
        if (role === 'ADMIN' || role === 'COORDINATOR') {
          return { granted: true, dataClassification: 'RESTRICTED' };
        }
        if (role === 'NAVIGATOR') {
          return { granted: true, dataClassification: 'RESTRICTED' };
        }
        if (role === 'SAFEGUARDING_REVIEWER') {
          return { granted: action === 'READ', reason: action !== 'READ' ? 'Chỉ được xem referral' : undefined, dataClassification: 'RESTRICTED' };
        }
        if (role === 'PARTNER') {
          if (!context.referralPartnerId || !context.actorPartnerId || context.referralPartnerId === context.actorPartnerId) {
            return { granted: true, dataClassification: 'MINIMUM_NECESSARY' };
          }
          return { granted: false, reason: 'Đối tác chỉ được thao tác trên referral được gửi đến tổ chức của mình.', dataClassification: 'MINIMUM_NECESSARY' };
        }
        return { granted: false, reason: 'Không có quyền truy cập referral.', dataClassification: 'RESTRICTED' };
      }

      case 'RESOURCE': {
        if (role === 'PUBLIC') {
          return { granted: action === 'READ', dataClassification: 'PUBLIC' };
        }
        if (role === 'ADMIN' || role === 'COORDINATOR') {
          return { granted: true, dataClassification: 'RESTRICTED' };
        }
        if (role === 'NAVIGATOR' || role === 'SAFEGUARDING_REVIEWER') {
          return { granted: action === 'READ', dataClassification: 'RESTRICTED' };
        }
        if (role === 'PARTNER') {
          return { granted: true, dataClassification: 'RESTRICTED' };
        }
        return { granted: action === 'READ', dataClassification: 'PUBLIC' };
      }

      case 'SAFEGUARDING': {
        if (role === 'SAFEGUARDING_REVIEWER') {
          return { granted: true, dataClassification: 'CONFIDENTIAL' };
        }
        if (role === 'COORDINATOR' || role === 'ADMIN') {
          return { granted: true, dataClassification: 'CONFIDENTIAL' };
        }
        if (role === 'NAVIGATOR') {
          // Navigator can report / view basic flags on own cases
          return { granted: action === 'CREATE' || action === 'READ', dataClassification: 'RESTRICTED' };
        }
        return { granted: false, reason: 'Không có quyền truy cập dữ liệu bảo vệ trẻ em / sự cố nhạy cảm.', dataClassification: 'CONFIDENTIAL' };
      }

      case 'AUDIT': {
        if (role === 'ADMIN' || role === 'COORDINATOR' || role === 'SAFEGUARDING_REVIEWER') {
          return { granted: action === 'READ' || action === 'AUDIT_VIEW', dataClassification: 'RESTRICTED' };
        }
        if (role === 'NAVIGATOR') {
          return { granted: action === 'READ', dataClassification: 'RESTRICTED' };
        }
        return { granted: false, reason: 'Không có quyền xem nhật ký kiểm toán.', dataClassification: 'RESTRICTED' };
      }

      case 'METRICS': {
        if (role === 'PUBLIC') {
          return { granted: action === 'READ', dataClassification: 'PUBLIC' };
        }
        return { granted: true, dataClassification: 'RESTRICTED' };
      }

      default:
        return { granted: false, reason: 'Tài nguyên chưa được định nghĩa trong RBAC Matrix.', dataClassification: 'RESTRICTED' };
    }
  }

  private static normalizeRole(roleString: string): CanonicalActorRole {
    const upper = (roleString || '').toUpperCase().trim();
    if (upper === 'NAVIGATOR' || upper === 'VOLUNTEER') return 'NAVIGATOR';
    if (upper === 'COORDINATOR' || upper === 'SOCIAL_WORKER') return 'COORDINATOR';
    if (upper === 'SAFEGUARDING_REVIEWER' || upper === 'SAFEGUARD_OFFICER') return 'SAFEGUARDING_REVIEWER';
    if (upper === 'PARTNER' || upper === 'PARTNER_STAFF') return 'PARTNER';
    if (upper === 'ADMIN' || upper === 'SYS_ADMIN') return 'ADMIN';
    return 'PUBLIC';
  }
}
