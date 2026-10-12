export function getOpenApiSpec(): Record<string, any> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'BƯỚC TIẾP API Engine — Canonical REST API v1',
      version: '1.0.0',
      description: 'Hệ thống Backend REST API Serverless trên Cloudflare D1 Native phục vụ Nền tảng Hỗ trợ Chuyển tiếp & An sinh Xã hội cho Người Lao động Đường phố và Trẻ em Yếu thế — UNESCO Youth Hackathon 2026.',
      contact: {
        name: 'Đội ngũ Dự án BƯỚC TIẾP',
        url: 'https://buoc-tiep-landing.pages.dev',
        email: 'hotro@buoctiep.vn'
      },
      license: {
        name: 'UNESCO Youth Hackathon 2026 Open Source Initiative',
        url: 'https://github.com/hungpixi/unesco-youth-hackathon-2026'
      }
    },
    servers: [
      {
        url: 'https://buoc-tiep-api.ppnh10092002.workers.dev',
        description: 'Production Serverless Worker (Cloudflare Edge D1 Native)'
      },
      {
        url: 'http://localhost:8787',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT Bearer Token được cấp từ POST /api/v1/auth/login hoặc POST /api/v1/auth/dev-login'
        }
      },
      schemas: {
        StandardSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 1 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 }
              }
            }
          }
        },
        StandardErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'CASE_NOT_FOUND' },
                message: { type: 'string', example: 'Không tìm thấy hồ sơ ca tương ứng.' },
                details: { type: 'object' },
                request_id: { type: 'string', example: 'req_2026_9881' }
              }
            }
          }
        },
        Case: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'case_2026_0012' },
            organizationId: { type: 'string', example: 'org-default' },
            beneficiaryId: { type: 'string', example: 'ben_2026_0042' },
            aliasName: { type: 'string', example: 'CHILD-2026-0042' },
            status: { type: 'string', enum: ['DRAFT', 'INTAKE', 'ASSESSED', 'MATCHED', 'REFERRED', 'FOLLOW_UP', 'RESOLVED', 'CLOSED', 'ESCALATED', 'ON_HOLD'], example: 'INTAKE' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'], example: 'high' },
            isMinor: { type: 'boolean', example: true },
            assignedTo: { type: 'string', example: 'usr-social-worker-01' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Resource: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'res-medical-01' },
            name: { type: 'string', example: 'Trạm Y tế Thị trấn Hóc Môn' },
            category: { type: 'string', enum: ['medical', 'shelter', 'food', 'legal', 'livelihood', 'education'], example: 'medical' },
            district: { type: 'string', example: 'Hóc Môn' },
            ward: { type: 'string', example: 'Thị trấn Hóc Môn' },
            address: { type: 'string', example: '12 Lý Thường Kiệt, Thị trấn Hóc Môn' },
            latitude: { type: 'number', example: 10.8872 },
            longitude: { type: 'number', example: 106.5925 },
            is24Hours: { type: 'boolean', example: true },
            verificationStatus: { type: 'string', enum: ['VERIFIED', 'UNVERIFIED', 'EXPIRED'], example: 'VERIFIED' },
            capacityStatus: { type: 'string', enum: ['AVAILABLE', 'LIMITED', 'FULL'], example: 'AVAILABLE' }
          }
        },
        Referral: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'ref_2026_001' },
            caseId: { type: 'string', example: 'case_2026_0012' },
            resourceId: { type: 'string', example: 'res-shelter-01' },
            type: { type: 'string', example: 'GENERAL' },
            status: { type: 'string', enum: ['proposed', 'submitted', 'opened_externally', 'accepted', 'declined', 'completed'], example: 'submitted' },
            privacyClassification: { type: 'string', enum: ['PUBLIC', 'RESTRICTED', 'CONFIDENTIAL'], example: 'RESTRICTED' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        LivelihoodPassport: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pass_2026_8891' },
            beneficiaryId: { type: 'string', example: 'ben_2026_0042' },
            status: { type: 'string', enum: ['active', 'in_progress', 'graduated', 'archived'], example: 'active' },
            skills: { type: 'array', items: { type: 'string' }, example: ['Sửa chữa xe máy', 'An toàn lao động'] },
            signedQrToken: { type: 'string', example: 'jwt.qr.sig.2026' }
          }
        },
        SafeguardingIncident: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'inc_p0_2026_001' },
            caseId: { type: 'string', example: 'case_2026_0012' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'], example: 'emergency' },
            escalatedTo111: { type: 'boolean', example: true },
            status: { type: 'string', enum: ['open', 'in_progress', 'resolved'], example: 'open' },
            reason: { type: 'string', example: 'Trẻ em lang thang có nguy cơ bị bóc lột sức lao động' }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          tags: ['15. Hệ Thống & Giám Sát'],
          summary: 'Liveness & Readiness Health Check',
          description: 'Kiểm tra trạng thái toàn diện của API Worker và kết nối CSDL D1 Native.',
          responses: {
            200: { description: 'Hệ thống hoạt động bình thường' }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['01. Xác Thực & Phân Quyền'],
          summary: 'Đăng nhập mật khẩu bảo mật (SHA-256)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'admin@buoctiep.vn' },
                    password: { type: 'string', example: '123456' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            200: { description: 'Đăng nhập thành công, trả về JWT Token và User Profile' },
            401: { description: 'Email hoặc mật khẩu không chính xác' }
          }
        }
      },
      '/api/v1/auth/google': {
        post: {
          tags: ['01. Xác Thực & Phân Quyền'],
          summary: 'Đăng nhập qua Google OAuth2 Single Sign-On',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id_token: { type: 'string', example: 'google_jwt_token_sample' },
                    access_token: { type: 'string', example: 'ya29.sample' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Đăng nhập Google thành công' }
          }
        }
      },
      '/api/v1/auth/dev-login': {
        post: {
          tags: ['01. Xác Thực & Phân Quyền'],
          summary: 'Đăng nhập nhanh môi trường Phát triển / Demo',
          description: 'Chỉ hoạt động khi DEV_LOGIN_ENABLED=true. Cấm tự ý mint admin token trên Production.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    role: { type: 'string', enum: ['volunteer', 'social_worker', 'admin', 'partner'], example: 'social_worker' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Token sinh thành công' }
          }
        }
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['01. Xác Thực & Phân Quyền'],
          summary: 'Lấy thông tin tài khoản đang đăng nhập',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Thông tin tài khoản và cấu hình an toàn' }
          }
        }
      },
      '/api/v1/cases': {
        get: {
          tags: ['03. Quản Lý Ca Đồng Hành'],
          summary: 'Tra cứu danh sách hồ sơ ca (Có phân quyền theo Tổ chức & Đội)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Lọc theo trạng thái ca' },
            { name: 'priority', in: 'query', schema: { type: 'string' }, description: 'Lọc theo mức độ ưu tiên' }
          ],
          responses: {
            200: { description: 'Danh sách hồ sơ ca' }
          }
        },
        post: {
          tags: ['03. Quản Lý Ca Đồng Hành'],
          summary: 'Tiếp nhận hồ sơ ca mới thực địa (Bảo đảm Consent Gate & Mã Ẩn Danh)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    beneficiaryId: { type: 'string', example: 'CHILD-2026-0001' },
                    aliasName: { type: 'string', example: 'Bé Hùng' },
                    birthYear: { type: 'integer', example: 2010 },
                    isMinor: { type: 'boolean', example: true },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'], example: 'high' },
                    location: { type: 'string', example: 'Chợ Đầu Mối Hóc Môn' }
                  },
                  required: ['aliasName']
                }
              }
            }
          },
          responses: {
            201: { description: 'Tạo hồ sơ ca thành công' }
          }
        }
      },
      '/api/v1/cases/{id}': {
        get: {
          tags: ['03. Quản Lý Ca Đồng Hành'],
          summary: 'Chi tiết hồ sơ ca, nhu cầu đa chiều & dòng thời gian',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Chi tiết hồ sơ ca đầy đủ' }
          }
        },
        patch: {
          tags: ['03. Quản Lý Ca Đồng Hành'],
          summary: 'Cập nhật thông tin ca hỗ trợ',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Cập nhật thành công' }
          }
        }
      },
      '/api/v1/cases/{id}/assign': {
        post: {
          tags: ['03. Quản Lý Ca Đồng Hành'],
          summary: 'Lệnh Phân bổ Cán bộ Phụ trách Ca (Command)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assignedTo: { type: 'string', example: 'usr-social-worker-01' },
                    reason: { type: 'string', example: 'Phân công theo dõi địa bàn Hóc Môn' }
                  },
                  required: ['assignedTo']
                }
              }
            }
          },
          responses: {
            200: { description: 'Phân bổ cán bộ thành công' }
          }
        }
      },
      '/api/v1/cases/{id}/close': {
        post: {
          tags: ['03. Quản Lý Ca Đồng Hành'],
          summary: 'Lệnh Đóng Ca có Kiểm Duyệt & Biên Bản Kết Quả (Command)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    outcomeStatus: { type: 'string', example: 'SUCCESSFUL_LIVELIHOOD_PLACEMENT' },
                    notes: { type: 'string', example: 'Đối tượng đã hoàn thành học nghề và có thu nhập ổn định.' }
                  },
                  required: ['outcomeStatus']
                }
              }
            }
          },
          responses: {
            200: { description: 'Đóng ca thành công' }
          }
        }
      },
      '/api/v1/cases/{id}/reopen': {
        post: {
          tags: ['03. Quản Lý Ca Đồng Hành'],
          summary: 'Lệnh Tái Mở Ca khi có Nhu Cầu Phát Sinh (Command)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Tái mở ca thành công' }
          }
        }
      },
      '/api/v1/cases/{id}/next-steps': {
        post: {
          tags: ['04. Bước An Toàn Tiếp Theo'],
          summary: 'Đề xuất & Xác nhận Bước An Toàn Tiếp Theo trong 24-48h',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', example: 'Khám sức khỏe tổng quát tại Trạm Y tế Hóc Môn' },
                    action: { type: 'string', example: 'Đưa đi khám & cấp phát thẻ BHYT' },
                    owner: { type: 'string', example: 'TNV Nam' },
                    dueAt: { type: 'string', format: 'date-time' }
                  },
                  required: ['title', 'action']
                }
              }
            }
          },
          responses: {
            201: { description: 'Ghi nhận Bước An Toàn thành công' }
          }
        }
      },
      '/api/v1/safeguarding/report': {
        post: {
          tags: ['05. Bảo Vệ Trẻ Em & Rule 0'],
          summary: 'Kích hoạt Báo Động Khẩn Cấp Rule 0 / Hotline 111 (1-Tap SOS)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    caseId: { type: 'string', example: 'case_2026_0012' },
                    childId: { type: 'string', example: 'CHILD-2026-0001' },
                    severity: { type: 'string', enum: ['P0_EMERGENCY', 'P1_HIGH', 'P2_MEDIUM'], example: 'P0_EMERGENCY' },
                    reason: { type: 'string', example: 'Trẻ em có dấu hiệu bị bạo hành và bóc lột sức lao động nặng' }
                  },
                  required: ['reason']
                }
              }
            }
          },
          responses: {
            201: { description: 'Tiếp nhận báo động khẩn cấp & kích hoạt quy trình can thiệp' }
          }
        }
      },
      '/api/v1/resources': {
        get: {
          tags: ['06. Danh Bạ Nguồn Lực An Sinh'],
          summary: 'Tra cứu Danh bạ Điểm An Sinh & Tọa Độ Địa Lý (Hỗ trợ Lọc 24/7, Quận Huyện)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'district', in: 'query', schema: { type: 'string' } },
            { name: 'is_24_hours', in: 'query', schema: { type: 'integer' } }
          ],
          responses: {
            200: { description: 'Danh sách các điểm an sinh đã xác thực' }
          }
        },
        post: {
          tags: ['06. Danh Bạ Nguồn Lực An Sinh'],
          summary: 'Thêm mới Điểm Nguồn Lực An Sinh',
          security: [{ BearerAuth: [] }],
          responses: {
            201: { description: 'Tạo điểm nguồn lực' }
          }
        }
      },
      '/api/v1/referrals': {
        get: {
          tags: ['07. Chuyển Tuyến An Sinh'],
          summary: 'Danh sách phiếu chuyển tuyến giữa các tổ chức',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Danh sách phiếu chuyển tuyến' }
          }
        },
        post: {
          tags: ['07. Chuyển Tuyến An Sinh'],
          summary: 'Phát hành Phiếu Chuyển Tuyến Form 07 Số Hóa',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    caseId: { type: 'string', example: 'case_2026_0012' },
                    resourceId: { type: 'string', example: 'res-shelter-01' },
                    notes: { type: 'string', example: 'Chuyển tuyến tiếp nhận tạm trú an toàn cho trẻ em' }
                  },
                  required: ['caseId', 'resourceId']
                }
              }
            }
          },
          responses: {
            201: { description: 'Phát hành phiếu chuyển tuyến thành công' }
          }
        }
      },
      '/api/v1/referrals/{id}/accept': {
        post: {
          tags: ['07. Chuyển Tuyến An Sinh'],
          summary: 'Lệnh Đơn Vị Tiếp Nhận Đồng Ý Hỗ Trợ (Command)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Chấp thuận chuyển tuyến' }
          }
        }
      },
      '/api/v1/referrals/{id}/decline': {
        post: {
          tags: ['07. Chuyển Tuyến An Sinh'],
          summary: 'Lệnh Từ Chối Chuyển Tuyến Kèm Lý Do Hợp Lệ (Command)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string', example: 'Cơ sở hiện đã vượt quá sức chứa tiếp nhận' }
                  },
                  required: ['reason']
                }
              }
            }
          },
          responses: {
            200: { description: 'Ghi nhận từ chối chuyển tuyến' }
          }
        }
      },
      '/api/v1/passports/{id}': {
        get: {
          tags: ['08. Hộ Chiếu Sinh Kế'],
          summary: 'Chi tiết Hộ chiếu Sinh kế 5 Bước & Mã QR Xác Thực',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Hồ sơ hộ chiếu sinh kế' }
          }
        }
      },
      '/api/v1/export/form07-docx': {
        get: {
          tags: ['09. Xuất Hồ Sơ Hành Chính'],
          summary: 'Kết xuất Tờ khai Mẫu 07 Nghị định 20/2021/NĐ-CP thành tệp Word (.docx) Chuẩn Hành Chính',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'caseId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Tệp Word (.docx) nhị phân',
              content: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {} }
            }
          }
        }
      },
      '/api/v1/survey/submit': {
        post: {
          tags: ['11. Khảo Sát Nghiên Cứu'],
          summary: 'Gửi kết quả khảo sát thực địa 4 bước',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    contact_name: { type: 'string', example: 'Nguyễn Văn Nam' },
                    contact_phone: { type: 'string', example: '0901234567' },
                    a1_experience: { type: 'string', example: 'Hơn 2 năm làm tình nguyện viên' }
                  },
                  required: ['contact_name', 'contact_phone']
                }
              }
            }
          },
          responses: {
            201: { description: 'Nộp khảo sát thành công' }
          }
        }
      },
      '/api/v1/impact/summary': {
        get: {
          tags: ['13. Tác Động Cộng Đồng & Public'],
          summary: 'Thống kê tác động an sinh xã hội & Tỷ lệ chuyển tiếp thành công (SNSR)',
          responses: {
            200: { description: 'Báo cáo chỉ số tác động xã hội' }
          }
        }
      },
      '/api/v1/mil/cards': {
        get: {
          tags: ['14. Thẻ Chống Lừa Đảo (MIL)'],
          summary: 'Danh sách Thẻ cảnh báo thủ đoạn lừa đảo việc làm & buôn người',
          responses: {
            200: { description: 'Danh sách thẻ thông tin phòng chống lừa đảo' }
          }
        }
      },
      '/api/v1/audit-logs': {
        get: {
          tags: ['15. Hệ Thống & Giám Sát'],
          summary: 'Tra cứu nhật ký kiểm toán hệ thống bất biến (Audit Logs)',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Nhật ký truy vết thao tác' }
          }
        }
      }
    }
  };
}
