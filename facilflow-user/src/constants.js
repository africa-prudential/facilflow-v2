import { C } from "./theme.js";

export const CR_STATUS = {
  draft:                   {label:"Draft",              color:C.muted,  bg:"#F8FAFC",   dot:"#CBD5E1"},
  pending_manager:         {label:"Submitted",          color:C.amber,  bg:C.amberBg,   dot:C.amber},
  pending_approval:        {label:"Pending Approval",   color:C.orange, bg:C.orangeBg,  dot:C.orange},
  pending_implementation:  {label:"Scheduled",          color:C.blue,   bg:C.blueBg,    dot:C.blue},
  in_progress:             {label:"In Progress",        color:C.teal,   bg:C.tealBg,    dot:C.teal},
  completed:               {label:"Completed",          color:C.green,  bg:C.greenBg,   dot:C.green},
  failed:                  {label:"Failed",             color:C.red,    bg:C.redBg,     dot:C.red},
  closed:                  {label:"Closed",             color:C.muted,  bg:"#F8FAFC",   dot:"#CBD5E1"},
  rejected:                {label:"Rejected",           color:C.red,    bg:C.redBg,     dot:C.red},
};

export const CR_CATEGORIES = ["New Feature","Enhancement","Fix"];
export const CR_MODULES = ["Greenpole","Sabivest","Other"];
export const DOC_LABELS = {
  uat_signoff:      "UAT Sign-off Form",
  test_scripts:     "Test Scripts",
  user_concurrence: "User Concurrence",
  other:            "Other Supporting Documents",
};

export const REQ_STATUS = {
  draft:            {label:"Draft",            color:C.muted,  bg:"#F8FAFC"},
  pending_approval: {label:"Pending Approval", color:C.amber,  bg:C.amberBg},
  approved:         {label:"Approved",         color:C.green,  bg:C.greenBg},
  in_progress:      {label:"In Progress",      color:C.blue,   bg:C.blueBg},
  completed:        {label:"Completed",        color:C.green,  bg:C.greenBg},
  rejected:         {label:"Rejected",         color:C.red,    bg:C.redBg},
};

import { LayoutDashboard, List, Check, RotateCcw, RefreshCw, Grid2x2, SearchCheck, Ticket } from "lucide-react";

export const NAV_GROUPS = [
  {group:"Main",items:[
    {key:"dashboard",    label:"Dashboard",       icon:LayoutDashboard,  roles:["employee","manager","resource_team"]},
    {key:"my_requests",  label:"My Requests",      icon:List,  roles:["employee","manager","resource_team"]},
    {key:"approvals",    label:"Approvals",        icon:Check,  roles:["manager"]},
    {key:"queue",        label:"Processing Queue", icon:RotateCcw,  roles:["resource_team"]},
  ]},
  {group:"Change Management",items:[
    {key:"change_requests",label:"Change Requests",icon:RefreshCw,  roles:["employee","manager","resource_team"]},
    {key:"change_calendar",label:"Change Calendar",icon:Grid2x2,  roles:["employee","manager","resource_team"]},
    {key:"cr_approvals",   label:"CR Approvals",   icon:Check,  roles:["manager"]},
    {key:"cr_review",      label:"Review Queue",   icon:SearchCheck,  roles:["resource_team"]},
  ]},
  {group:"Support",items:[
    {key:"helpdesk", label:"My Tickets", icon:Ticket, roles:["employee","manager","resource_team"]},
  ]},
];

export const TICKET_STATUS_USER = {
  open:        {label:"Open",        color:C.amber,  bg:C.amberBg},
  assigned:    {label:"Assigned",    color:C.blue,   bg:C.blueBg},
  in_progress: {label:"In Progress", color:C.blue,   bg:C.blueBg},
  pending:     {label:"Pending",     color:C.muted,  bg:"#EEF0F4"},
  resolved:    {label:"Resolved",    color:C.green,  bg:C.greenBg},
  fulfilled:   {label:"Fulfilled",   color:C.green,  bg:C.greenBg},
  closed:      {label:"Closed",      color:C.muted,  bg:"#EEF0F4"},
  rejected:    {label:"Rejected",    color:C.red,    bg:C.redBg},
};

export const TICKET_PRIORITY_USER = {
  critical:{label:"Critical",color:C.red,   bg:C.redBg},
  high:    {label:"High",    color:C.amber, bg:C.amberBg},
  medium:  {label:"Medium",  color:C.blue,  bg:C.blueBg},
  low:     {label:"Low",     color:C.green, bg:C.greenBg},
};
