import { C } from "./theme.js";

export const TENANTS = [
  {id:"T001", name:"Africa Prudential Plc",  domain:"africaprudential.com",  plan:"Enterprise", users:28, status:"active"},
  {id:"T002", name:"Lagos State Pension",    domain:"lspc.gov.ng",           plan:"Business",   users:12, status:"active"},
];

let USERS_SEED = [
  {id:"U001",tenantId:"T001",name:"Adaeze Okonkwo",   initials:"AO",email:"adaeze@africaprudential.com",  role:"employee",      dept:"Finance",    status:"active",   createdAt:"2023-06-01T09:00:00"},
  {id:"U002",tenantId:"T001",name:"Chukwuemeka Eze",  initials:"CE",email:"chukwu@africaprudential.com",  role:"manager",       dept:"Finance",    status:"active",   createdAt:"2023-06-01T09:00:00"},
  {id:"U003",tenantId:"T001",name:"Ngozi Adeyemi",    initials:"NA",email:"ngozi@africaprudential.com",   role:"resource_team", dept:"Facilities", status:"active",   createdAt:"2023-06-05T10:00:00"},
  {id:"U004",tenantId:"T001",name:"Oluwaseun Balogun",initials:"OB",email:"seun@africaprudential.com",    role:"admin",         dept:"IT",         status:"active",   createdAt:"2023-06-01T08:00:00"},
  {id:"U005",tenantId:"T001",name:"Amaka Ihejirika",  initials:"AI",email:"amaka@africaprudential.com",   role:"employee",      dept:"HR",         status:"active",   createdAt:"2023-07-10T09:00:00"},
  {id:"U006",tenantId:"T001",name:"Tunde Fashola",    initials:"TF",email:"tunde@africaprudential.com",   role:"manager",       dept:"IT",         status:"suspended",createdAt:"2023-07-15T09:00:00"},
];

let VEHICLES_SEED = [
  {id:"CAR001",tenantId:"T001",plate:"AAA-001BE",model:"Toyota Camry",    year:2022,color:"Silver", status:"available",       driverId:"DRV001",lastUpdated:"2024-01-15T09:00:00"},
  {id:"CAR002",tenantId:"T001",plate:"BBB-234FG",model:"Toyota Corolla",  year:2021,color:"White",  status:"in_use",          driverId:"DRV002",lastUpdated:"2024-01-16T08:30:00"},
  {id:"CAR003",tenantId:"T001",plate:"CCC-567HJ",model:"Toyota Hilux",   year:2020,color:"Blue",   status:"under_maintenance",driverId:null,    lastUpdated:"2024-01-10T14:00:00"},
  {id:"CAR004",tenantId:"T001",plate:"DDD-890KL",model:"Hyundai Elantra", year:2023,color:"Black",  status:"available",       driverId:"DRV003",lastUpdated:"2024-01-15T11:00:00"},
  {id:"CAR005",tenantId:"T001",plate:"EEE-123MN",model:"Toyota Prado",   year:2022,color:"White",  status:"reserved",        driverId:null,    lastUpdated:"2024-01-17T09:00:00"},
];

let DRIVERS_SEED = [
  {id:"DRV001",tenantId:"T001",name:"Babatunde Olatunji",license:"LGA-2019-4567",phone:"+234 803 123 4567",status:"available",   vehicleId:"CAR001",lastUpdated:"2024-01-15T09:00:00"},
  {id:"DRV002",tenantId:"T001",name:"Emeka Chukwu",       license:"LGA-2018-8901",phone:"+234 806 987 6543",status:"unavailable", vehicleId:"CAR002",lastUpdated:"2024-01-16T08:00:00"},
  {id:"DRV003",tenantId:"T001",name:"Sunday Adeyinka",    license:"LGA-2020-2345",phone:"+234 815 456 7890",status:"available",   vehicleId:"CAR004",lastUpdated:"2024-01-14T16:00:00"},
  {id:"DRV004",tenantId:"T001",name:"Rotimi Adeleke",     license:"LGA-2021-6789",phone:"+234 802 345 6789",status:"suspended",   vehicleId:null,    lastUpdated:"2023-12-01T09:00:00"},
];

let INVENTORY_SEED = [
  {id:"INV001",tenantId:"T001",name:"A4 Paper (Ream)",      code:"STA-001",stock:45,unit:"ream", desc:"80gsm A4 paper reams for office printing",       category:"Paper",    lastUpdated:"2024-01-10T08:00:00"},
  {id:"INV002",tenantId:"T001",name:"Ballpoint Pens (Box)", code:"STA-002",stock:8, unit:"box",  desc:"Blue and black ballpoint pens, 50 per box",       category:"Writing",  lastUpdated:"2024-01-09T10:00:00"},
  {id:"INV003",tenantId:"T001",name:"Stapler",              code:"EQP-001",stock:12,unit:"unit", desc:"Heavy duty desktop staplers",                     category:"Equipment",lastUpdated:"2024-01-08T09:00:00"},
  {id:"INV004",tenantId:"T001",name:"Sticky Notes (Pack)",  code:"STA-003",stock:3, unit:"pack", desc:"76x76mm sticky note pads, assorted colours",      category:"Paper",    lastUpdated:"2024-01-11T14:00:00"},
  {id:"INV005",tenantId:"T001",name:"Highlighters (Set)",   code:"STA-004",stock:15,unit:"set",  desc:"5-colour highlighter sets",                       category:"Writing",  lastUpdated:"2024-01-07T11:00:00"},
  {id:"INV006",tenantId:"T001",name:"Printer Cartridge",    code:"EQP-002",stock:4, unit:"unit", desc:"HP LaserJet compatible black toner cartridges",   category:"Equipment",lastUpdated:"2024-01-12T10:00:00"},
  {id:"INV007",tenantId:"T001",name:"Whiteboard Markers",   code:"STA-005",stock:22,unit:"set",  desc:"Dry-erase markers, 4 colours per set",            category:"Writing",  lastUpdated:"2024-01-06T09:00:00"},
];

const AUDIT_SEED = [
  {id:"AL001",at:"2024-01-17T09:30:00",by:"U004",action:"USER_INVITED",   target:"newuser@africaprudential.com",detail:"Invitation sent to new employee"},
  {id:"AL002",at:"2024-01-16T14:05:00",by:"U004",action:"EMERGENCY_CR",   target:"CR-000003",detail:"Emergency SSL renewal CR raised"},
  {id:"AL003",at:"2024-01-16T10:00:00",by:"U004",action:"VEHICLE_STATUS", target:"CAR002",   detail:"Vehicle status changed to In Use"},
  {id:"AL004",at:"2024-01-15T09:00:00",by:"U004",action:"USER_SUSPENDED", target:"U006",     detail:"User Tunde Fashola suspended"},
  {id:"AL005",at:"2024-01-14T14:30:00",by:"U004",action:"STOCK_ADJUSTED", target:"INV001",   detail:"A4 Paper stock adjusted: 30 → 45"},
  {id:"AL006",at:"2024-01-13T11:00:00",by:"U004",action:"DRIVER_ADDED",   target:"DRV004",   detail:"Driver Rotimi Adeleke registered"},
  {id:"AL007",at:"2024-01-12T09:00:00",by:"U004",action:"POLICY_UPDATED", target:"CR_POLICY",detail:"CR approval policy updated for Normal changes"},
  {id:"AL008",at:"2024-01-10T10:00:00",by:"U004",action:"CREATE_CR",      target:"CR-000001",detail:"Azure API Gateway CR created"},
];

const CR_SEED = [
  {id:"CR-000001",title:"Azure API Gateway v2 Deployment",      initiator:"U001",createdAt:"2024-01-10T10:00:00",updatedAt:"2024-01-13T14:00:00",status:"scheduled",   changeType:"Normal",   riskLevel:"High",   environment:"Production",system:"Azure API Gateway"},
  {id:"CR-000002",title:"Database Index Optimisation",           initiator:"U001",createdAt:"2024-01-08T08:00:00",updatedAt:"2024-01-13T10:00:00",status:"closed",      changeType:"Standard", riskLevel:"Low",    environment:"Production",system:"Core Banking DB"},
  {id:"CR-000003",title:"EMERGENCY: SSL Certificate Renewal",   initiator:"U001",createdAt:"2024-01-16T14:00:00",updatedAt:"2024-01-16T15:00:00",status:"in_progress", changeType:"Emergency",riskLevel:"High",   environment:"Production",system:"Payment Gateway",isEmergency:true},
  {id:"CR-000004",title:"MFA Rollout – Staff Portal",            initiator:"U001",createdAt:"2024-01-14T11:00:00",updatedAt:"2024-01-15T09:00:00",status:"change_review",changeType:"Normal",  riskLevel:"Medium", environment:"Production",system:"Staff Portal"},
  {id:"CR-000005",title:"Network Switch Firmware Upgrade",       initiator:"U005",createdAt:"2024-01-17T09:00:00",updatedAt:"2024-01-17T09:30:00",status:"pending_line_manager",changeType:"Normal",riskLevel:"Medium",environment:"Production",system:"Network Infra"},
];

// ── STATUS / META ──────────────────────────────────────────────

export const CR_STATUS = {
  draft:{label:"Draft",color:C.muted,bg:"#F8FAFC"},
  pending_line_manager:{label:"Pending L1",color:C.amber,bg:C.amberBg},
  pending_secondary:{label:"Pending L2",color:C.orange,bg:C.orangeBg},
  change_review:{label:"In Review",color:C.violet,bg:C.violetBg},
  scheduled:{label:"Scheduled",color:C.blue,bg:C.blueBg},
  in_progress:{label:"In Progress",color:C.teal,bg:C.tealBg},
  completed:{label:"Completed",color:C.green,bg:C.greenBg},
  post_review:{label:"Post Review",color:C.violet,bg:C.violetBg},
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

export const STAFF_ROLES = ["employee","manager","resource_team"];
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

export const NAV = [
  {group:"Overview", roles:["super_admin","facility_admin","it_admin"], items:[
    {k:"dashboard",  l:"Dashboard",        icon:"◫"},
  ]},
  {group:"People & Access", roles:["super_admin"], items:[
    {k:"users",      l:"User Management",  icon:"👤"},
  ]},
  {group:"Facilities", roles:["super_admin","facility_admin"], items:[
    {k:"requests",   l:"Facility Requests",icon:"📋"},
    {k:"fleet",      l:"Fleet Management", icon:"🚗"},
    {k:"drivers",    l:"Driver Roster",    icon:"🪪"},
    {k:"inventory",  l:"Inventory",        icon:"📦"},
  ]},
  {group:"Change Management", roles:["super_admin","it_admin"], items:[
    {k:"change_requests", l:"Change Requests",  icon:"⟳"},
    {k:"cr_policy",       l:"CR Policy",        icon:"⚙"},
    {k:"change_config",   l:"Change Config",    icon:"🔧"},
  ]},
  {group:"IT Management", roles:["super_admin","it_admin"], items:[
    {k:"it_subscriptions",l:"IT Subscriptions", icon:"💳"},
    {k:"helpdesk",        l:"Helpdesk",         icon:"🎫"},
    {k:"asset_registry",  l:"Asset Registry",   icon:"💻"},
  ]},
  {group:"System", roles:["super_admin"], items:[
    {k:"notifications",l:"Notifications",  icon:"🔔"},
    {k:"audit",        l:"Audit Log",       icon:"📋"},
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

