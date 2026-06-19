/*
  ELX LoadIQ - Driver Schedule backend schema
  Scope: Driver Schedule only
  Target: Azure SQL Database

  Notes:
  - Uses soft delete for operational records.
  - Uses UTC timestamps.
  - Keeps status values constrained in SQL for first production version.
  - Audit table is append-only by application convention.
*/

CREATE TABLE dbo.drivers (
  id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_drivers_id DEFAULT NEWID(),
  display_name NVARCHAR(150) NOT NULL,
  email NVARCHAR(255) NULL,
  phone NVARCHAR(50) NULL,
  status NVARCHAR(30) NOT NULL CONSTRAINT df_drivers_status DEFAULT N'Available',
  notes NVARCHAR(1000) NULL,
  is_deleted BIT NOT NULL CONSTRAINT df_drivers_is_deleted DEFAULT 0,
  created_at DATETIME2(3) NOT NULL CONSTRAINT df_drivers_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2(3) NOT NULL CONSTRAINT df_drivers_updated_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT pk_drivers PRIMARY KEY CLUSTERED (id),
  CONSTRAINT ck_drivers_status CHECK (status IN (N'Available', N'Unavailable', N'Annual Leave', N'Sick Leave', N'Day Off'))
);

CREATE UNIQUE INDEX ux_drivers_email_active
ON dbo.drivers(email)
WHERE email IS NOT NULL AND is_deleted = 0;

CREATE INDEX ix_drivers_status_active
ON dbo.drivers(status, is_deleted);

CREATE TABLE dbo.trucks (
  id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_trucks_id DEFAULT NEWID(),
  truck_number NVARCHAR(50) NOT NULL,
  status NVARCHAR(30) NOT NULL CONSTRAINT df_trucks_status DEFAULT N'Available',
  current_location NVARCHAR(200) NULL,
  notes NVARCHAR(1000) NULL,
  is_deleted BIT NOT NULL CONSTRAINT df_trucks_is_deleted DEFAULT 0,
  created_at DATETIME2(3) NOT NULL CONSTRAINT df_trucks_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2(3) NOT NULL CONSTRAINT df_trucks_updated_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT pk_trucks PRIMARY KEY CLUSTERED (id),
  CONSTRAINT ck_trucks_status CHECK (status IN (N'Available', N'In Use', N'Maintenance', N'Unavailable', N'Retired'))
);

CREATE UNIQUE INDEX ux_trucks_number_active
ON dbo.trucks(truck_number)
WHERE is_deleted = 0;

CREATE INDEX ix_trucks_status_active
ON dbo.trucks(status, is_deleted);

CREATE TABLE dbo.trailers (
  id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_trailers_id DEFAULT NEWID(),
  trailer_number NVARCHAR(50) NOT NULL,
  trailer_type NVARCHAR(80) NULL,
  status NVARCHAR(30) NOT NULL CONSTRAINT df_trailers_status DEFAULT N'Available',
  notes NVARCHAR(1000) NULL,
  is_deleted BIT NOT NULL CONSTRAINT df_trailers_is_deleted DEFAULT 0,
  created_at DATETIME2(3) NOT NULL CONSTRAINT df_trailers_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2(3) NOT NULL CONSTRAINT df_trailers_updated_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT pk_trailers PRIMARY KEY CLUSTERED (id),
  CONSTRAINT ck_trailers_status CHECK (status IN (N'Available', N'In Use', N'Maintenance', N'Unavailable', N'Retired'))
);

CREATE UNIQUE INDEX ux_trailers_number_active
ON dbo.trailers(trailer_number)
WHERE is_deleted = 0;

CREATE INDEX ix_trailers_status_active
ON dbo.trailers(status, is_deleted);

CREATE TABLE dbo.driver_schedules (
  id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_driver_schedules_id DEFAULT NEWID(),
  driver_id UNIQUEIDENTIFIER NOT NULL,
  truck_id UNIQUEIDENTIFIER NULL,
  trailer_id UNIQUEIDENTIFIER NULL,
  load_plan_number NVARCHAR(80) NULL,
  customer_name NVARCHAR(150) NULL,
  pickup_location NVARCHAR(200) NULL,
  delivery_location NVARCHAR(200) NULL,
  start_datetime_utc DATETIME2(3) NOT NULL,
  end_datetime_utc DATETIME2(3) NOT NULL,
  status NVARCHAR(40) NOT NULL,
  con_note NVARCHAR(80) NULL,
  notes NVARCHAR(2000) NULL,
  is_deleted BIT NOT NULL CONSTRAINT df_driver_schedules_is_deleted DEFAULT 0,
  created_by NVARCHAR(255) NOT NULL,
  updated_by NVARCHAR(255) NOT NULL,
  created_at DATETIME2(3) NOT NULL CONSTRAINT df_driver_schedules_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2(3) NOT NULL CONSTRAINT df_driver_schedules_updated_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT pk_driver_schedules PRIMARY KEY CLUSTERED (id),
  CONSTRAINT fk_driver_schedules_driver FOREIGN KEY (driver_id) REFERENCES dbo.drivers(id),
  CONSTRAINT fk_driver_schedules_truck FOREIGN KEY (truck_id) REFERENCES dbo.trucks(id),
  CONSTRAINT fk_driver_schedules_trailer FOREIGN KEY (trailer_id) REFERENCES dbo.trailers(id),
  CONSTRAINT ck_driver_schedules_dates CHECK (end_datetime_utc > start_datetime_utc),
  CONSTRAINT ck_driver_schedules_status CHECK (status IN (
    N'Scheduled',
    N'Picked Up',
    N'In Transit',
    N'At Depot',
    N'Delivered',
    N'Annual Leave',
    N'Sick Leave',
    N'Day Off',
    N'Maintenance',
    N'Delayed'
  ))
);

CREATE INDEX ix_driver_schedules_range_active
ON dbo.driver_schedules(start_datetime_utc, end_datetime_utc, is_deleted);

CREATE INDEX ix_driver_schedules_driver_range_active
ON dbo.driver_schedules(driver_id, start_datetime_utc, end_datetime_utc, is_deleted);

CREATE INDEX ix_driver_schedules_truck_range_active
ON dbo.driver_schedules(truck_id, start_datetime_utc, end_datetime_utc, is_deleted)
WHERE truck_id IS NOT NULL;

CREATE INDEX ix_driver_schedules_trailer_range_active
ON dbo.driver_schedules(trailer_id, start_datetime_utc, end_datetime_utc, is_deleted)
WHERE trailer_id IS NOT NULL;

CREATE INDEX ix_driver_schedules_status_active
ON dbo.driver_schedules(status, is_deleted);

CREATE TABLE dbo.audit_events (
  id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_audit_events_id DEFAULT NEWID(),
  entity_type NVARCHAR(80) NOT NULL,
  entity_id UNIQUEIDENTIFIER NOT NULL,
  action NVARCHAR(40) NOT NULL,
  actor_user_id NVARCHAR(255) NULL,
  actor_email NVARCHAR(255) NOT NULL,
  before_json NVARCHAR(MAX) NULL,
  after_json NVARCHAR(MAX) NULL,
  ip_address NVARCHAR(64) NULL,
  user_agent NVARCHAR(512) NULL,
  created_at DATETIME2(3) NOT NULL CONSTRAINT df_audit_events_created_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT pk_audit_events PRIMARY KEY CLUSTERED (id),
  CONSTRAINT ck_audit_events_action CHECK (action IN (N'CREATE', N'UPDATE', N'DELETE', N'STATUS_CHANGE', N'ASSIGNMENT_CHANGE', N'DATE_CHANGE'))
);

CREATE INDEX ix_audit_events_entity
ON dbo.audit_events(entity_type, entity_id, created_at DESC);

CREATE INDEX ix_audit_events_actor
ON dbo.audit_events(actor_email, created_at DESC);
