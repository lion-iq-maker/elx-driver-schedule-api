/*
  ELX LoadIQ - Driver Schedule seed data
  Scope: Driver Schedule only

  Run after database/schema.sql.
  This script is idempotent for the fixed prototype IDs below.
*/

MERGE dbo.drivers AS target
USING (VALUES
  ('11111111-1111-4111-8111-111111111111', N'John Smith', N'john.smith@elxlogistics.com', N'Available'),
  ('22222222-2222-4222-8222-222222222222', N'Mark Wilson', N'mark.wilson@elxlogistics.com', N'Available'),
  ('33333333-3333-4333-8333-333333333333', N'Available Driver 2', NULL, N'Available'),
  ('44444444-4444-4444-8444-444444444444', N'Amelia Jones', N'amelia.jones@elxlogistics.com', N'Available'),
  ('55555555-5555-4555-8555-555555555555', N'Daniel Kumar', N'daniel.kumar@elxlogistics.com', N'Available'),
  ('66666666-6666-4666-8666-666666666666', N'Sarah Chen', N'sarah.chen@elxlogistics.com', N'Annual Leave'),
  ('77777777-7777-4777-8777-777777777777', N'Liam Brown', N'liam.brown@elxlogistics.com', N'Unavailable'),
  ('88888888-8888-4888-8888-888888888888', N'Priya Singh', N'priya.singh@elxlogistics.com', N'Day Off')
) AS source (id, display_name, email, status)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET display_name = source.display_name, email = source.email, status = source.status, is_deleted = 0, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (id, display_name, email, status)
  VALUES (source.id, source.display_name, source.email, source.status);

MERGE dbo.trucks AS target
USING (VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', N'TK-204', N'In Use', N'Western Highway'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', N'TK-266', N'In Use', N'Regency Park'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', N'TK-502', N'Available', N'Adelaide DC'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', N'TK-101', N'Available', N'Melbourne Depot'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', N'TK-309', N'Maintenance', N'Workshop Bay 2'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', N'TK-377', N'Unavailable', N'Adelaide DC'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', N'TK-411', N'Unavailable', N'Port Adelaide'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', N'TK-155', N'Available', N'Adelaide DC')
) AS source (id, truck_number, status, current_location)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET truck_number = source.truck_number, status = source.status, current_location = source.current_location, is_deleted = 0, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (id, truck_number, status, current_location)
  VALUES (source.id, source.truck_number, source.status, source.current_location);

MERGE dbo.trailers AS target
USING (VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', N'TR-5678', N'Curtainsider', N'In Use'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', N'TR-9021', N'Flat Top', N'In Use'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', N'TR-1134', N'Refrigerated', N'Available'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', N'TR-4402', N'Drop Deck', N'Available'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', N'TR-7788', N'Tautliner', N'Maintenance'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', N'TR-9901', N'Mezzanine', N'Unavailable'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', N'TR-2210', N'Curtainsider', N'In Use'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8', N'TR-3345', N'Flat Top', N'Available')
) AS source (id, trailer_number, trailer_type, status)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET trailer_number = source.trailer_number, trailer_type = source.trailer_type, status = source.status, is_deleted = 0, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (id, trailer_number, trailer_type, status)
  VALUES (source.id, source.trailer_number, source.trailer_type, source.status);

MERGE dbo.driver_schedules AS target
USING (VALUES
  ('90000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', N'LP-2024-0001', N'ABC Logistics', N'Adelaide DC', N'Melbourne Linehaul', '2026-06-18T08:15:00.000', '2026-06-19T17:10:00.000', N'In Transit', N'CN-123456', N'Linehaul running to plan.'),
  ('90000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', N'LP-2024-0004', N'Toll', N'Regency Park', N'Port Melbourne', '2026-06-18T09:00:00.000', '2026-06-18T18:00:00.000', N'Picked Up', N'CN-654321', N'Pickup confirmed.'),
  ('90000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', N'LP-2024-0007', N'BHP', N'Adelaide DC', N'Sydney DC', '2026-06-19T13:30:00.000', '2026-06-21T08:20:00.000', N'Scheduled', N'CN-789456', N'Awaiting release.'),
  ('90000000-0000-4000-8000-000000000004', '44444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', N'LP-2024-0008', N'Linfox', N'Gepps Cross', N'Melbourne Depot', '2026-06-17T07:00:00.000', '2026-06-18T11:30:00.000', N'Delivered', N'CN-987654', N'POD received.'),
  ('90000000-0000-4000-8000-000000000005', '55555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', NULL, N'Fleet', N'Adelaide DC', N'Workshop Bay 2', '2026-06-18T06:00:00.000', '2026-06-20T16:00:00.000', N'Maintenance', NULL, N'Scheduled service.'),
  ('90000000-0000-4000-8000-000000000006', '66666666-6666-4666-8666-666666666666', NULL, NULL, NULL, N'Internal', NULL, NULL, '2026-06-18T00:00:00.000', '2026-06-22T23:59:00.000', N'Annual Leave', NULL, N'Annual leave approved.'),
  ('90000000-0000-4000-8000-000000000007', '77777777-7777-4777-8777-777777777777', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', N'LP-2024-0010', N'Visy', N'Port Adelaide', N'Perth Depot', '2026-06-18T10:30:00.000', '2026-06-23T15:20:00.000', N'Delayed', N'CN-147852', N'Mechanical delay under review.'),
  ('90000000-0000-4000-8000-000000000008', '88888888-8888-4888-8888-888888888888', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8', NULL, N'Internal', NULL, NULL, '2026-06-20T00:00:00.000', '2026-06-20T23:59:00.000', N'Day Off', NULL, N'Rostered day off.')
) AS source (
  id, driver_id, truck_id, trailer_id, load_plan_number, customer_name,
  pickup_location, delivery_location, start_datetime_utc, end_datetime_utc,
  status, con_note, notes
)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET
    driver_id = source.driver_id,
    truck_id = source.truck_id,
    trailer_id = source.trailer_id,
    load_plan_number = source.load_plan_number,
    customer_name = source.customer_name,
    pickup_location = source.pickup_location,
    delivery_location = source.delivery_location,
    start_datetime_utc = source.start_datetime_utc,
    end_datetime_utc = source.end_datetime_utc,
    status = source.status,
    con_note = source.con_note,
    notes = source.notes,
    is_deleted = 0,
    updated_by = N'seed@elxlogistics.com',
    updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (
    id, driver_id, truck_id, trailer_id, load_plan_number, customer_name,
    pickup_location, delivery_location, start_datetime_utc, end_datetime_utc,
    status, con_note, notes, created_by, updated_by
  )
  VALUES (
    source.id, source.driver_id, source.truck_id, source.trailer_id, source.load_plan_number, source.customer_name,
    source.pickup_location, source.delivery_location, source.start_datetime_utc, source.end_datetime_utc,
    source.status, source.con_note, source.notes, N'seed@elxlogistics.com', N'seed@elxlogistics.com'
  );
