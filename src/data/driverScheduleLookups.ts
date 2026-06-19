import { type DriverScheduleLookups, scheduleStatuses } from "../domain/driverSchedule";

export const driverScheduleLookups: DriverScheduleLookups = {
  drivers: [
    { id: "11111111-1111-4111-8111-111111111111", displayName: "John Smith", email: "john.smith@elxlogistics.com", status: "Available" },
    { id: "22222222-2222-4222-8222-222222222222", displayName: "Mark Wilson", email: "mark.wilson@elxlogistics.com", status: "Available" },
    { id: "33333333-3333-4333-8333-333333333333", displayName: "Available Driver 2", email: null, status: "Available" },
    { id: "44444444-4444-4444-8444-444444444444", displayName: "Amelia Jones", email: "amelia.jones@elxlogistics.com", status: "Available" },
    { id: "55555555-5555-4555-8555-555555555555", displayName: "Daniel Kumar", email: "daniel.kumar@elxlogistics.com", status: "Available" },
    { id: "66666666-6666-4666-8666-666666666666", displayName: "Sarah Chen", email: "sarah.chen@elxlogistics.com", status: "Annual Leave" },
    { id: "77777777-7777-4777-8777-777777777777", displayName: "Liam Brown", email: "liam.brown@elxlogistics.com", status: "Unavailable" },
    { id: "88888888-8888-4888-8888-888888888888", displayName: "Priya Singh", email: "priya.singh@elxlogistics.com", status: "Day Off" }
  ],
  trucks: [
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", truckNumber: "TK-204", status: "In Use", currentLocation: "Western Highway" },
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", truckNumber: "TK-266", status: "In Use", currentLocation: "Regency Park" },
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", truckNumber: "TK-502", status: "Available", currentLocation: "Adelaide DC" },
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", truckNumber: "TK-101", status: "Available", currentLocation: "Melbourne Depot" },
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5", truckNumber: "TK-309", status: "Maintenance", currentLocation: "Workshop Bay 2" },
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6", truckNumber: "TK-377", status: "Unavailable", currentLocation: "Adelaide DC" },
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7", truckNumber: "TK-411", status: "Delayed", currentLocation: "Port Adelaide" },
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8", truckNumber: "TK-155", status: "Available", currentLocation: "Adelaide DC" }
  ],
  trailers: [
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", trailerNumber: "TR-5678", trailerType: "Curtainsider", status: "In Use" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2", trailerNumber: "TR-9021", trailerType: "Flat Top", status: "In Use" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3", trailerNumber: "TR-1134", trailerType: "Refrigerated", status: "Available" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4", trailerNumber: "TR-4402", trailerType: "Drop Deck", status: "Available" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5", trailerNumber: "TR-7788", trailerType: "Tautliner", status: "Maintenance" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6", trailerNumber: "TR-9901", trailerType: "Mezzanine", status: "Unavailable" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7", trailerNumber: "TR-2210", trailerType: "Curtainsider", status: "In Use" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8", trailerNumber: "TR-3345", trailerType: "Flat Top", status: "Available" }
  ],
  statuses: scheduleStatuses
};
