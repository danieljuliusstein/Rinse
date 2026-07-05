/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
  {
    "id": "pbc_det_packages",
    "name": "packages",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "name",
        "type": "text",
        "required": true
      },
      {
        "name": "base_price",
        "type": "number",
        "required": true
      },
      {
        "name": "description",
        "type": "text"
      },
      {
        "name": "default_supplies",
        "type": "json"
      },
      {
        "name": "active",
        "type": "bool",
        "required": true
      }
    ]
  },
  {
    "id": "pbc_det_clients",
    "name": "clients",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "name",
        "type": "text",
        "required": true
      },
      {
        "name": "phone",
        "type": "text"
      },
      {
        "name": "email",
        "type": "text"
      },
      {
        "name": "address",
        "type": "text"
      },
      {
        "name": "lead_source",
        "type": "select",
        "values": [
          "google",
          "referral",
          "instagram",
          "facebook",
          "tiktok",
          "word_of_mouth",
          "website",
          "text",
          "other"
        ]
      },
      {
        "name": "tags",
        "type": "json"
      },
      {
        "name": "notes",
        "type": "text"
      }
    ]
  },
  {
    "id": "pbc_det_supplies",
    "name": "supplies",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "name",
        "type": "text",
        "required": true
      },
      {
        "name": "unit",
        "type": "text",
        "required": true
      },
      {
        "name": "quantity_on_hand",
        "type": "number",
        "required": true
      },
      {
        "name": "reorder_threshold",
        "type": "number"
      },
      {
        "name": "cost_per_unit",
        "type": "number"
      },
      {
        "name": "supplier",
        "type": "text"
      }
    ]
  },
  {
    "id": "pbc_det_overhead",
    "name": "overhead_expenses",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "name",
        "type": "text",
        "required": true
      },
      {
        "name": "amount",
        "type": "number",
        "required": true
      },
      {
        "name": "category",
        "type": "select",
        "values": [
          "vehicle",
          "insurance",
          "equipment",
          "software",
          "marketing",
          "other"
        ]
      },
      {
        "name": "billing_cycle",
        "type": "select",
        "values": [
          "monthly",
          "annual",
          "one_time"
        ]
      },
      {
        "name": "next_due",
        "type": "date"
      },
      {
        "name": "notes",
        "type": "text"
      }
    ]
  },
  {
    "id": "pbc_det_appset",
    "name": "app_settings",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "business_name",
        "type": "text"
      },
      {
        "name": "business_phone",
        "type": "text"
      },
      {
        "name": "business_email",
        "type": "text"
      },
      {
        "name": "business_address",
        "type": "text"
      },
      {
        "name": "invoice_terms_footer",
        "type": "text"
      },
      {
        "name": "logo",
        "type": "file",
        "maxSelect": 1,
        "maxSize": 5242880
      },
      {
        "name": "notifications",
        "type": "json"
      },
      {
        "name": "last_backup_at",
        "type": "date"
      }
    ]
  },
  {
    "id": "pbc_det_notiflog",
    "name": "notifications_log",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "type",
        "type": "select",
        "values": [
          "job_reminder",
          "morning_reminder",
          "follow_up",
          "invoice_overdue",
          "low_inventory"
        ]
      },
      {
        "name": "reference_id",
        "type": "text"
      },
      {
        "name": "scheduled_for",
        "type": "date",
        "required": true
      },
      {
        "name": "sent_at",
        "type": "date"
      },
      {
        "name": "status",
        "type": "select",
        "values": [
          "pending",
          "sent",
          "failed"
        ]
      }
    ]
  },
  {
    "id": "pbc_det_jobs",
    "name": "jobs",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "date",
        "type": "date",
        "required": true
      },
      {
        "name": "start_time",
        "type": "text"
      },
      {
        "name": "hours_worked",
        "type": "number"
      },
      {
        "name": "location_type",
        "type": "select",
        "required": true,
        "values": [
          "mobile",
          "fixed"
        ]
      },
      {
        "name": "package_id",
        "type": "relation",
        "required": true,
        "collectionId": "pbc_det_packages",
        "maxSelect": 1
      },
      {
        "name": "vehicle_type",
        "type": "select",
        "required": true,
        "values": [
          "sedan",
          "suv",
          "truck",
          "van",
          "boat",
          "other"
        ]
      },
      {
        "name": "client_id",
        "type": "relation",
        "required": true,
        "collectionId": "pbc_det_clients",
        "maxSelect": 1
      },
      {
        "name": "status",
        "type": "select",
        "required": true,
        "values": [
          "scheduled",
          "in_progress",
          "completed",
          "invoiced",
          "paid"
        ]
      },
      {
        "name": "revenue",
        "type": "number",
        "required": true
      },
      {
        "name": "tip",
        "type": "number"
      },
      {
        "name": "expenses",
        "type": "json"
      },
      {
        "name": "supplies_used",
        "type": "json"
      },
      {
        "name": "travel_cost",
        "type": "number"
      },
      {
        "name": "marketing_cost",
        "type": "number"
      },
      {
        "name": "equipment_depreciation",
        "type": "number"
      },
      {
        "name": "notes",
        "type": "text"
      },
      {
        "name": "photos",
        "type": "file",
        "maxSelect": 99,
        "maxSize": 10485760
      },
      {
        "name": "photo_meta",
        "type": "json"
      },
      {
        "name": "invoice_id",
        "type": "relation",
        "collectionId": "pbc_det_invoices",
        "maxSelect": 1
      },
      {
        "name": "created_by",
        "type": "text"
      },
      {
        "name": "updated_by",
        "type": "text"
      }
    ]
  },
  {
    "id": "pbc_det_invoices",
    "name": "invoices",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "indexes": [],
    "fields": [
      {
        "name": "invoice_number",
        "type": "text",
        "required": true
      },
      {
        "name": "job_id",
        "type": "relation",
        "required": true,
        "collectionId": "pbc_det_jobs",
        "maxSelect": 1
      },
      {
        "name": "client_id",
        "type": "relation",
        "required": true,
        "collectionId": "pbc_det_clients",
        "maxSelect": 1
      },
      {
        "name": "subtotal",
        "type": "number",
        "required": true
      },
      {
        "name": "tip",
        "type": "number"
      },
      {
        "name": "total",
        "type": "number",
        "required": true
      },
      {
        "name": "status",
        "type": "select",
        "required": true,
        "values": [
          "draft",
          "sent",
          "partial",
          "paid",
          "overdue"
        ]
      },
      {
        "name": "payments",
        "type": "json"
      },
      {
        "name": "amount_paid",
        "type": "number"
      },
      {
        "name": "balance_due",
        "type": "number"
      },
      {
        "name": "sent_at",
        "type": "date"
      },
      {
        "name": "paid_at",
        "type": "date"
      },
      {
        "name": "terms",
        "type": "text"
      },
      {
        "name": "notes",
        "type": "text"
      },
      {
        "name": "logo_url",
        "type": "text"
      },
      {
        "name": "terms_footer",
        "type": "text"
      }
    ]
  }
]
  // false = merge mode — do NOT delete users/auth or other existing collections
  return app.importCollections(snapshot, false)
}, (app) => {
  return null
})
