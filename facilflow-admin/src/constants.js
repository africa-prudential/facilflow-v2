import { C } from "./theme.js";


// ── STATUS / META ──────────────────────────────────────────────

export const CR_STATUS = {
  draft:{label:"Draft",color:C.muted,bg:"#F8FAFC"},
  pending_line_manager:{label:"Pending Line Manager",color:C.orange,bg:C.orangeBg},
  pending_manager:{label:"Submitted",color:C.amber,bg:C.amberBg},
  pending_approval:{label:"Pending Approval",color:C.orange,bg:C.orangeBg},
  pending_implementation:{label:"Scheduled",color:C.blue,bg:C.blueBg},
  in_progress:{label:"In Progress",color:C.teal,bg:C.tealBg},
  completed:{label:"Completed",color:C.green,bg:C.greenBg},
  failed:{label:"Failed",color:C.red,bg:C.redBg},
  closed:{label:"Closed",color:C.muted,bg:"#F8FAFC"},
  rejected:{label:"Rejected",color:C.red,bg:C.redBg},
};

export const VEHICLE_STATUSES = [
  {v:"available",        l:"Available",        color:C.green, bg:C.greenBg},
  {v:"in_use",           l:"In Use",           color:C.blue,  bg:C.blueBg},
  {v:"under_maintenance",l:"Under Maintenance",color:C.amber, bg:C.amberBg},
  {v:"reserved",         l:"Reserved",         color:C.violet,bg:C.violetBg},
  {v:"out_of_service",   l:"Out of Service",   color:C.red,   bg:C.redBg},
];

export const DRIVER_STATUSES = [
  {v:"available",  l:"Available",   color:C.green, bg:C.greenBg},
  {v:"unavailable",l:"Not Available",color:C.amber, bg:C.amberBg},
  {v:"suspended",  l:"Suspended",   color:C.red,   bg:C.redBg},
  {v:"resigned",   l:"Resigned",    color:C.muted, bg:"#F8FAFC"},
];

export const DOC_TYPES = ["Insurance","Road Worthiness","Vehicle License"];

export const SUB_CATEGORIES = ["Design","Hosting","Email","Communication","Security","Analytics","Development","Productivity","Other"];
export const SUB_STATUSES   = [
  {v:"active",          l:"Active",          color:C.green, bg:C.greenBg},
  {v:"pending_renewal", l:"Pending Renewal", color:C.amber, bg:C.amberBg},
  {v:"expired",         l:"Expired",         color:C.red,   bg:C.redBg},
  {v:"cancelled",       l:"Cancelled",       color:C.muted, bg:"#F8FAFC"},
];
export const SUB_CYCLES = ["Monthly","Quarterly","Semi-Annual","Annual"];
export const SUB_REMINDER_OPTS = [
  {v:"daily",       l:"Daily"},
  {v:"every_2_weeks",l:"Every 2 Weeks"},
  {v:"monthly",     l:"Monthly"},
  {v:"quarterly",   l:"Quarterly"},
];

export const STAFF_ROLES = ["staff","line_manager"];
export const ADMIN_ROLE_TYPES = ["super_admin","facility_admin","it_admin"];
export const USER_ROLES = [...STAFF_ROLES, ...ADMIN_ROLE_TYPES];

export const ADMIN_ROLE_META = {
  super_admin:    { label:"Super Admin",    color:C.brand,  bg:C.brandLt },
  facility_admin: { label:"Facility Admin", color:C.blue,   bg:C.blueBg  },
  it_admin:       { label:"IT Admin",       color:C.violet, bg:C.violetBg},
};

export const TICKET_STATUS = { open:{label:"Open",color:C.amber,bg:C.amberBg}, assigned:{label:"Assigned",color:C.blue,bg:C.blueBg}, in_progress:{label:"In Progress",color:C.blue,bg:C.blueBg}, pending:{label:"Pending",color:C.muted,bg:C.surface}, approved:{label:"Approved",color:C.green,bg:C.greenBg}, resolved:{label:"Resolved",color:C.green,bg:C.greenBg}, fulfilled:{label:"Fulfilled",color:C.green,bg:C.greenBg}, closed:{label:"Closed",color:C.muted,bg:C.surface}, rejected:{label:"Rejected",color:C.red,bg:C.redBg} };
export const TICKET_PRIORITY = { critical:{label:"Critical",color:C.red,bg:C.redBg}, high:{label:"High",color:C.amber,bg:C.amberBg}, medium:{label:"Medium",color:C.blue,bg:C.blueBg}, low:{label:"Low",color:C.green,bg:C.greenBg} };

export const ASSET_STATUS = { new:{label:"New",color:C.violet,bg:C.violetBg}, in_store:{label:"In Store",color:C.teal,bg:C.tealBg}, available:{label:"Available",color:C.green,bg:C.greenBg}, assigned:{label:"Assigned",color:C.blue,bg:C.blueBg}, in_repair:{label:"In Repair",color:C.amber,bg:C.amberBg}, condemned:{label:"Condemned",color:C.red,bg:C.redBg}, bidded:{label:"Bidded",color:C.orange,bg:C.orangeBg}, retired:{label:"Retired",color:C.muted,bg:C.surface}, lost:{label:"Lost",color:C.red,bg:C.redBg} };

import { LayoutDashboard, User, ClipboardList, Car, IdCard, Package, RefreshCw, Settings, Wrench, CreditCard, Ticket, Laptop, Bell, Building2, UserCog } from "lucide-react";

export const NAV = [
  {group:"Overview", roles:["super_admin","facility_admin","it_admin"], items:[
    {k:"dashboard",  l:"Dashboard",        icon:LayoutDashboard},
  ]},
  {group:"People & Access", roles:["super_admin"], items:[
    {k:"users",       l:"User Management", icon:User},
    {k:"departments", l:"Departments",     icon:Building2},
  ]},
  {group:"Facilities", roles:["super_admin","facility_admin"], items:[
    {k:"requests",   l:"Facility Requests",icon:ClipboardList},
    {k:"fleet",      l:"Fleet Management", icon:Car},
    {k:"drivers",    l:"Driver Roster",    icon:IdCard},
    {k:"inventory",  l:"Inventory",        icon:Package},
    {k:"facility_ops",l:"Facility Ops",    icon:UserCog},
  ]},
  {group:"Change Management", roles:["super_admin","it_admin"], items:[
    {k:"change_requests", l:"Change Requests",  icon:RefreshCw},
    {k:"cr_policy",       l:"CR Policy",        icon:Settings},
    {k:"change_config",   l:"Change Config",    icon:Wrench},
  ]},
  {group:"IT Management", roles:["super_admin","it_admin"], items:[
    {k:"it_subscriptions",l:"IT Subscriptions", icon:CreditCard},
    {k:"helpdesk",        l:"Helpdesk",         icon:Ticket},
    {k:"asset_registry",  l:"Asset Registry",   icon:Laptop},
  ]},
  {group:"System", roles:["super_admin"], items:[
    {k:"notifications",l:"Notifications",  icon:Bell},
    {k:"audit",        l:"Audit Log",       icon:ClipboardList},
  ]},
];


export const DEFAULT_TRIGGERS=[
  {id:"T1",event:"CR Submitted",      enabled:true, channels:["email","in_app"],  template:"A new change request {cr_id} has been submitted by {user}.",   reminder:24},
  {id:"T2",event:"CR Approved (L1)",  enabled:true, channels:["email","in_app"],  template:"Change request {cr_id} has received L1 approval from {approver}.", reminder:0},
  {id:"T3",event:"CR Approved (L2)",  enabled:true, channels:["email"],           template:"Change request {cr_id} has received L2 approval. Awaiting review.", reminder:0},
  {id:"T4",event:"CR Scheduled",      enabled:true, channels:["email","in_app"],  template:"{cr_id} has been scheduled for deployment on {date} at {time}.",reminder:48},
  {id:"T5",event:"CR Rejected",       enabled:true, channels:["email","in_app"],  template:"Your change request {cr_id} has been rejected. Reason: {reason}.", reminder:0},
  {id:"T6",event:"Reminder: Approval",enabled:true, channels:["email"],           template:"Reminder: Change request {cr_id} is awaiting your approval.",     reminder:12},
  {id:"T7",event:"Low Inventory",     enabled:true, channels:["in_app"],          template:"{item} is running low on stock ({qty} remaining).",               reminder:72},
  {id:"T8",event:"Fleet Status Change",enabled:false,channels:["in_app"],         template:"Vehicle {plate} status changed to {status} by {user}.",           reminder:0},
];


export const ASSET_CATS = ["Laptop","Desktop","Monitor","Phone","Tablet","Printer","Networking","Furniture","Software","Other"];

// Fixed change_roles keys seeded outside the approval-level system — never
// selectable as an approval level's Required Role.
export const FIXED_CR_ROLE_KEYS = ["change_manager","change_implementer","change_reviewer"];

