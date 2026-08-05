import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  supabase,
  fetchRequests, createRequest, updateRequest,
  fetchCRs, createCR, updateCR,
  fetchNotifications, markNotificationsRead,
  fetchInventory,
  fetchVehicles,
  fetchDrivers,
  fetchUserChangeRoles,
  fetchUsersWithChangeRole,
  fetchApprovalLevels,
  fetchTenantConfig,
  updateCRStage,
  fetchMyTickets, createTicket, updateTicket, fetchTicketComments, addTicketComment, fetchTicketCategories, uploadTicketAttachment,
  addAuditEntry,
  APP_URL,
} from "./lib/supabase.js";
import { emailCRSubmitted, emailCRApproved, emailCRRejected, emailCRScheduled, emailRequestApproved, emailTicketCreated, emailTicketComment, emailTicketReceived, emailTicketStatusUpdate } from "./lib/email.js";
import { C, btn } from "./theme.js";
import { CR_STATUS, NAV_GROUPS } from "./constants.js";
import { fmtDT, normCR, normReq } from "./utils.js";
import { Av, Toast } from "./components/ui.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Approvals from "./pages/Approvals.jsx";
import Queue from "./pages/Queue.jsx";
import ChangePage from "./pages/ChangePage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import CRApprovals from "./pages/CRApprovals.jsx";
import CRReview from "./pages/CRReview.jsx";
import HelpdeskUser from "./pages/HelpdeskUser.jsx";

export default function UserApp({ currentUser }){
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.replace(/^\//,"") || "dashboard";
  const setPage = useCallback((key)=>navigate(`/${key}`),[navigate]);
  const [notifs,  setNotifs] = useState([]);
  const [bellOpen,setBell]   = useState(false);
  const [reqs,    setReqs]   = useState([]);
  const [crs,     setCrs]    = useState([]);
  const [invItems,  setInvItems]  = useState([]);
  const [vehicles,    setVehicles]    = useState([]);
  const [drivers,     setDrivers]     = useState([]);
  const [myChangeRoles, setMyChangeRoles] = useState([]);
  const [approvalLevels,setApprovalLevels]= useState([]);
  const [tenantConfig,  setTenantConfig]  = useState(null);
  const [crUsers,       setCRUsers]       = useState({});
  const [users,      setUsers]     = useState({});
  const [tickets,    setTickets]   = useState([]);
  const [ticketCats, setTicketCats]= useState([]);
  const [toast,   setToast]  = useState(null);
  const [loading, setLoading]= useState(true);

  const me = currentUser;
  const uid = currentUser?.id;
  const tenantId = currentUser?.tenant_id;

  // ── INITIAL DATA LOAD ──────────────────────────────────────
  useEffect(()=>{
    if(!tenantId) return;
    const load = async ()=>{
      try {
        const [reqData, crData, notifData, invData, userData] = await Promise.all([
          fetchRequests(tenantId),
          fetchCRs(tenantId),
          fetchNotifications(uid),
          fetchInventory(tenantId),
          supabase.from("users").select("*").eq("tenant_id", tenantId),
        ]);
        setReqs((reqData || []).map(normReq));
        setCrs((crData || []).map(normCR));
        setNotifs(notifData || []);
        setInvItems(invData || []);
        // Build users map keyed by id
        const umap = {};
        (userData.data || []).forEach(u => { umap[u.id] = u; });
        setUsers(umap);

        // Fetch vehicles and drivers separately — non-fatal if RLS blocks
        try {
          const [vd, dd] = await Promise.all([fetchVehicles(tenantId), fetchDrivers(tenantId)]);
          setVehicles(Array.isArray(vd) ? vd : []);
          setDrivers(Array.isArray(dd) ? dd : []);
        } catch(ve){ console.warn("Vehicles/drivers fetch skipped:", ve.message); }

        // Fetch change management config — non-fatal
        try {
          const [myRoles, levels, config] = await Promise.all([
            fetchUserChangeRoles(uid),
            fetchApprovalLevels(tenantId),
            fetchTenantConfig(tenantId),
          ]);
          setMyChangeRoles(myRoles||[]);
          setApprovalLevels(levels||[]);
          setTenantConfig(config);
          // Load users with change roles for CR workflows
          const roleKeys = ['change_manager','change_reviewer','change_approver_l1','change_approver_l2','change_implementer'];
          const roleUsers = {};
          await Promise.all(roleKeys.map(async rk => {
            const us = await fetchUsersWithChangeRole(rk, tenantId);
            roleUsers[rk] = us||[];
          }));
          setCRUsers(roleUsers);
        } catch(ce){ console.warn("Change roles fetch skipped:", ce.message); }

        // Load helpdesk tickets — non-fatal
        try {
          const [tix, cats] = await Promise.all([
            fetchMyTickets(uid, tenantId),
            fetchTicketCategories(tenantId),
          ]);
          setTickets(tix||[]);
          setTicketCats(cats||[]);
        } catch(te){ console.warn("Helpdesk fetch skipped:", te.message); }
      } catch(e){ console.error("Load error:", e); }
      finally { setLoading(false); }
    };
    load();
  },[tenantId, uid]);

  const unread = notifs.filter(n=>!n.read).length;

  const flash = useCallback((msg,type="success")=>{
    setToast({msg,type});
    setTimeout(()=>setToast(null),3200);
  },[]);

  // ── REQUESTS ──────────────────────────────────────────────
  const submitReq = useCallback(async (data)=>{
    try {
      const now = new Date();
      const iso = now.toISOString();
      const id  = `REQ-${now.getFullYear()}-${String(reqs.length+1).padStart(3,"0")}`;
      const rec = {
        id, tenant_id:tenantId, type:data.type, title:data.title,
        submitted_by:uid, approver_id:null,
        status:"pending_approval",
        details:data.details||{},
        history:[{s:"draft",at:iso,by:uid},{s:"pending_approval",at:iso,by:uid}],
        created_at:iso, updated_at:iso,
      };
      const saved = await createRequest(rec);
      setReqs(p=>[normReq(saved),...p]);
      flash(`${id} submitted`);
    } catch(e){ flash(e.message,"error"); }
  },[reqs.length, uid, tenantId, flash]);

  const transReq = useCallback(async (id,ns,note="")=>{
    try {
      const req = reqs.find(r=>r.id===id);
      const newHistory = [...(req.history||[]),{s:ns,at:new Date().toISOString(),by:uid,note}];
      const saved = await updateRequest(id,{status:ns, history:newHistory});
      setReqs(p=>p.map(r=>r.id===id?normReq(saved):r));
      flash(`Request ${ns.replace(/_/g," ")}`);
    } catch(e){ flash(e.message,"error"); }
  },[reqs, uid, flash]);

  // ── CHANGE REQUESTS ────────────────────────────────────────
  const submitCR = useCallback(async (data)=>{
    try {
      const iso   = new Date().toISOString();
      const count = crs.length + 1;
      const id    = `CR-${String(count).padStart(6,"0")}`;

      // Get change manager — always fetch fresh from DB to avoid stale state
      let managerId = tenantConfig?.change_manager_id || null;
      if(!managerId){
        try {
          const {data:freshConfig} = await supabase.from("change_tenant_config").select("change_manager_id").eq("tenant_id",tenantId).single();
          managerId = freshConfig?.change_manager_id || null;
        } catch(ce){ console.warn("Could not fetch tenant config:", ce.message); }
      }

      // Build approval stages from configured levels that apply to this change type
      const applicableLevels = (approvalLevels||[]).filter(l=>
        (l.change_types||[]).includes(data.changeType)
      );
      const levelStages = applicableLevels.map(l=>({
        level: l.level_order,
        name:  l.name,
        role_key: l.role_key,
        status:"pending",
        approver_id:null,
        approved_at:null,
        note:"",
      }));

      const rec = {
        id,
        tenant_id:        tenantId,
        title:            data.title,
        initiator:        uid,
        status:           "pending_manager",
        current_stage:    "pending_manager",
        current_level:    0,
        change_manager_id: managerId,
        reviewer_ids:     data.reviewerIds||[],
        change_type:      data.changeType,
        risk_level:       data.riskLevel,
        environment:      data.environment,
        system_name:      data.system,
        category:         data.category,
        description:      data.desc,
        deploy_date:      data.deployDate||null,
        deploy_start:     data.deployStart||null,
        deploy_end:       data.deployEnd||null,
        rollback:         data.rollback,
        test_evidence:    data.testEvidence,
        is_emergency:     data.changeType==="Emergency",
        version:          1,
        level_approvals:  levelStages,
        reviewer_comments:[],
        history:[
          {s:"draft",            at:iso, by:uid, label:"Draft created"},
          {s:"pending_manager",  at:iso, by:uid, label:"Submitted to Change Manager"},
        ],
        attachments:[...(data.attachments||[]).map(f=>({name:f.name,size:f.size}))],
        comments:[],
        stage_entered_at: iso,
        created_at:iso, updated_at:iso,
      };

      const saved = await createCR(rec);
      setCrs(p=>[normCR(saved),...p]);
      addAuditEntry({tenant_id:tenantId, performed_by:uid, action:"CR_SUBMITTED", target:id, detail:`${data.title} submitted (${data.changeType||"—"})`}).catch(console.warn);

      if(!managerId){
        flash(`${id} submitted — ⚠ No Change Manager configured. Go to Admin → CR Policy to set one.`, "error");
        return;
      }
      flash(`${id} submitted — notifying Change Manager...`);

      // Notify change manager — always fetch fresh from DB
      if(managerId){
        try {
          const {data:mgrRow} = await supabase.from("users").select("email,name").eq("id",managerId).single();
          const mgrEmail = mgrRow?.email;
          const mgrName  = mgrRow?.name||"Change Manager";
          if(mgrEmail){
            const emailResult = await supabase.functions.invoke("send-email",{body:{
              template:"cr_stage_notification",
              to: mgrEmail,
              data:{
                cr_id:   id,
                title:   data.title,
                stage:   "Change Manager Review",
                subject: `${id} - ${data.title} - Change Manager Review`,
                action:  `Hi ${mgrName}, a new change request has been submitted and requires your review and approval.`,
                app_url: APP_URL,
              }
            }});
            if(emailResult.error) flash(`CR submitted but email failed: ${emailResult.error.message}`, "error");
          } else {
            flash("CR submitted — no email sent (change manager has no email address)", "error");
          }
        } catch(ne){ flash(`CR submitted but email error: ${ne.message}`, "error"); }
      } else {
        flash("CR submitted — no Change Manager configured. Set one in admin CR Policy.", "error");
      }

    } catch(e){ flash(e.message,"error"); }
  },[crs.length, uid, tenantId, flash, tenantConfig, approvalLevels, users]);

  // ── ADVANCE CR STAGE ─────────────────────────────────────
  const advanceCR = useCallback(async (id, action, note="", extra={})=>{
    try {
      const cr = crs.find(c=>c.id===id);
      if(!cr) return;
      const iso = new Date().toISOString();
      const levels = cr.level_approvals||[];
      let nextStatus = cr.status;
      let nextLevel  = cr.current_level||0;
      let nextStage  = cr.current_stage;
      let newHistory = [...(cr.history||[])];
      let updates    = {};

      if(action === "reject"){
        nextStatus = "rejected";
        nextStage  = "rejected";
        newHistory.push({s:"rejected", at:iso, by:uid, label:"Rejected", note});
      }
      else if(action === "approve_manager"){
        // Manager approved — move to first approval level or implementation if no levels
        if(levels.length > 0){
          nextStatus = "pending_approval";
          nextStage  = `pending_level_${levels[0].level}`;
          nextLevel  = levels[0].level;
          newHistory.push({s:"pending_approval", at:iso, by:uid, label:"Manager Approved", note});
        } else {
          nextStatus = "pending_implementation";
          nextStage  = "pending_implementation";
          newHistory.push({s:"pending_implementation", at:iso, by:uid, label:"Manager Approved — No approval levels configured", note});
        }
      }
      else if(action === "approve_level"){
        // Approve current level — move to next or implementation
        const currentLevelIdx = (cr.current_level||1) - 1;
        const updatedLevels = levels.map((l,i)=>
          i===currentLevelIdx ? {...l, status:"approved", approver_id:uid, approved_at:iso, note} : l
        );
        updates.level_approvals = updatedLevels;
        newHistory.push({s:`level_${cr.current_level}_approved`, at:iso, by:uid, label:`Level ${cr.current_level} Approved`, note});

        const nextLevelObj = levels[currentLevelIdx+1];
        if(nextLevelObj){
          nextStatus = "pending_approval";
          nextStage  = `pending_level_${nextLevelObj.level}`;
          nextLevel  = nextLevelObj.level;
        } else {
          nextStatus = "pending_implementation";
          nextStage  = "pending_implementation";
          newHistory.push({s:"pending_implementation", at:iso, by:uid, label:"All approvals complete"});
        }
      }
      else if(action === "start_implementation"){
        nextStatus = "in_progress";
        nextStage  = "in_progress";
        newHistory.push({s:"in_progress", at:iso, by:uid, label:"Implementation started"});
        updates.implementation_started_at = iso;
      }
      else if(action === "complete_implementation"){
        nextStatus = extra.outcome==="failed" ? "failed" : "completed";
        nextStage  = nextStatus;
        newHistory.push({s:nextStatus, at:iso, by:uid, label:`Implementation ${extra.outcome||"completed"}`, note});
        updates.implementation_completed_at = iso;
        updates.implementation_notes   = extra.implementationNotes||"";
        updates.implementation_outcome = extra.outcome||"successful";
      }
      else if(action === "close"){
        nextStatus = "closed";
        nextStage  = "closed";
        newHistory.push({s:"closed", at:iso, by:uid, label:"Change closed"});
      }
      else if(action === "reviewer_comment"){
        const newComments = [...(cr.reviewer_comments||[]), {by:uid, at:iso, comment:note, concur:extra.concur}];
        updates.reviewer_comments = newComments;
        newHistory.push({s:"reviewer_comment", at:iso, by:uid, label:`Reviewer comment`, note});
      }

      const stageChanged = nextStage !== cr.current_stage;
      if(stageChanged){
        updates.stage_entered_at = iso;
        updates.reminder_sent_at = null;
        updates.escalated_at     = null;
      }

      const saved = await updateCR(id,{
        ...updates,
        status:        nextStatus,
        current_stage: nextStage,
        current_level: nextLevel,
        history:       newHistory,
      });
      setCrs(p=>p.map(c=>c.id===id?normCR(saved):c));
      flash(`CR updated: ${nextStatus.replace(/_/g," ")}`);
      if(stageChanged) addAuditEntry({tenant_id:cr.tenant_id, performed_by:uid, action:"CR_STAGE_ADVANCED", target:id, detail:`${cr.current_stage} → ${nextStage}${note?` (${note})`:""}`}).catch(console.warn);

      // Send stage notification emails — level-based, backward notification
      try {
        const emailRecipients = [];
        const appUrl = APP_URL;

        // Helper: fetch user email from DB directly
        const getEmail = async (userId) => {
          if(!userId) return null;
          if(users[userId]?.email) return users[userId].email;
          const {data:u} = await supabase.from("users").select("email,name").eq("id",userId).single();
          return u?.email||null;
        };

        // Helper: fetch all users with a role key
        const getRoleEmails = async (roleKey) => {
          const cached = (crUsers||{})[roleKey]||[];
          if(cached.length>0) return cached.map(u=>u.email).filter(Boolean);
          const {data:ucr} = await supabase.from("user_change_roles")
            .select("user_id, users(email)")
            .eq("role_key",roleKey).eq("tenant_id",tenantId);
          return (ucr||[]).map(r=>r.users?.email).filter(Boolean);
        };

        // Always notify technician (backward visibility)
        const techEmail = await getEmail(saved.initiator);
        if(techEmail) emailRecipients.push(techEmail);

        let stageLabel = "";

        if(action==="approve_manager"){
          // Manager approved → send to L1 approvers (or implementers if no levels)
          const levels = saved.level_approvals||[];
          if(levels.length>0){
            stageLabel = levels[0].name||"Level 1 Approval";
            const approverEmails = await getRoleEmails(levels[0].role_key);
            approverEmails.forEach(e=>emailRecipients.push(e));
          } else {
            stageLabel = "Implementation";
            const implEmails = await getRoleEmails("change_implementer");
            implEmails.forEach(e=>emailRecipients.push(e));
          }
          // Also notify technician that manager approved
          const mgrEmail = await getEmail(saved.change_manager_id);
          if(mgrEmail) emailRecipients.push(mgrEmail);
        }
        else if(action==="approve_level"){
          const levels = saved.level_approvals||[];
          const nextLevel = levels.find(l=>l.level===saved.current_level);
          if(nextLevel){
            stageLabel = nextLevel.name||`Level ${saved.current_level} Approval`;
            const approverEmails = await getRoleEmails(nextLevel.role_key);
            approverEmails.forEach(e=>emailRecipients.push(e));
          } else {
            stageLabel = "Implementation";
            const implEmails = await getRoleEmails("change_implementer");
            implEmails.forEach(e=>emailRecipients.push(e));
          }
          // Backward: notify manager + previous level approvers
          const mgrEmail = await getEmail(saved.change_manager_id);
          if(mgrEmail) emailRecipients.push(mgrEmail);
        }
        else if(action==="reject"){
          stageLabel = "Rejected";
          const mgrEmail = await getEmail(saved.change_manager_id);
          if(mgrEmail) emailRecipients.push(mgrEmail);
        }
        else if(action==="start_implementation"){
          stageLabel = "Implementation Started";
          const mgrEmail = await getEmail(saved.change_manager_id);
          if(mgrEmail) emailRecipients.push(mgrEmail);
        }
        else if(action==="complete_implementation"){
          stageLabel = saved.implementation_outcome==="failed"?"Implementation Failed":"Implementation Completed";
          const mgrEmail = await getEmail(saved.change_manager_id);
          if(mgrEmail) emailRecipients.push(mgrEmail);
        }

        // Deduplicate and send
        const uniqueEmails=[...new Set(emailRecipients)].filter(Boolean);
        if(uniqueEmails.length>0 && stageLabel){
          const emailRes = await supabase.functions.invoke("send-email",{body:{
            template:"cr_stage_notification",
            to: uniqueEmails,
            data:{
              cr_id:   saved.id,
              title:   saved.title,
              stage:   stageLabel,
              subject: `${saved.id} - ${saved.title} - ${stageLabel}`,
              action:  action==="reject"
                ? "This change request has been rejected. Please review and raise a new CR if needed."
                : `Action required: The change request has progressed to ${stageLabel}.`,
              note:    note||"",
              app_url: appUrl,
            }
          }});
          if(emailRes?.error) flash(`CR updated but email failed: ${emailRes.error.message}`, "error");
        }
      } catch(ne){ flash(`CR updated but notification error: ${ne.message}`, "error"); }

    } catch(e){ flash(e.message,"error"); }
  },[crs, uid, flash, users, crUsers]);

  const transCR = useCallback(async (id,ns,note="",extra={})=>{
    // Legacy wrapper — use advanceCR for new workflow
    try {
      const cr = crs.find(c=>c.id===id);
      const newHistory = [...(cr.history||[]),{
        s:ns, at:new Date().toISOString(), by:uid,
        label:CR_STATUS[ns]?.label||ns, note,
      }];
      const saved = await updateCR(id,{
        ...extra, status:ns, history:newHistory,
      });
      setCrs(p=>p.map(c=>c.id===id?normCR(saved):c));
      flash(`CR: ${CR_STATUS[ns]?.label||ns}`);
    } catch(e){ flash(e.message,"error"); }
  },[crs, uid, flash]);

  const handleSignOut = async ()=>{
    await supabase.auth.signOut();
  };

  const ctx = {
    me, uid, tenantId,
    reqs, setReqs,
    crs, setCrs,
    notifs, setNotifs,
    invItems,
    users,
    vehicles,
    drivers,
    myChangeRoles,
    approvalLevels,
    tenantConfig,
    crUsers,
    submitReq, transReq,
    submitCR, transCR, advanceCR,
    flash,
    tickets, setTickets, ticketCats,
    createTicketFn: async (data) => {
      const id = data.id || `TKT-${Date.now().toString(36).toUpperCase()}`;
      const ticket = {
        ...data,
        id,
        tenant_id: tenantId,
        requester_id: uid,
        status: 'open',
        linked_cr_id: data.linked_cr_id || null,
        mode: data.mode || 'portal',
      };
      const saved = await createTicket(ticket);
      setTickets(p => [saved, ...p]);
      // Notify IT admins of new ticket
      const adminEmails = Object.values(users).filter(u=>['admin','it_admin','super_admin'].includes(u.role)).map(u=>u.email).filter(Boolean);
      if(adminEmails.length) emailTicketCreated(adminEmails, saved, me?.name||'Staff').catch(()=>{});
      // Send receipt confirmation to the submitter
      if(me?.email) emailTicketReceived(me.email, saved).catch(()=>{});
      return saved;
    },
    uploadAttachmentFn: uploadTicketAttachment,
    fetchCommentsFn: fetchTicketComments,
    addCommentFn: (comment) => addTicketComment({ ...comment, author_id: uid }),
  };

  const hasChangeRole = (myChangeRoles||[]).length > 0;
  const visNav = NAV_GROUPS
    .map(g=>({...g,items:g.items.filter(i=>{
      if(!i.roles.includes(me?.role)) return false;
      if(i.key==='change_requests' && !hasChangeRole) return false;
      return true;
    })}))
    .filter(g=>g.items.length);

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"system-ui",color:C.muted,fontSize:14,background:C.pageBg}}>
      Loading FaciliFlow…
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.pageBg,fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}
        input:focus,select:focus,textarea:focus{outline:none;border-color:${C.brand}!important;box-shadow:0 0 0 2.5px ${C.brand}18!important}
        button:hover{opacity:.88}tr:hover>td{background:#FAFAFA}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:${C.borderDk};border-radius:4px}
        @keyframes slideUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}
      </style>

      {/* ── TOPBAR ────────────────────────── */}
      <header style={{height:52,background:"#fff",borderBottom:`1px solid ${C.border}`,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 20px",flexShrink:0,position:"sticky",top:0,zIndex:200}}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{width:30,height:30,borderRadius:7,background:C.brand,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:13,fontWeight:900,color:"#fff",letterSpacing:"-.05em"}}>AP</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1}}>Africa Prudential</div>
              <div style={{fontSize:9,color:C.muted,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase"}}>Staff Portal</div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {/* Bell */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setBell(p=>!p)} style={{...btn("ghost"),padding:"5px 9px",position:"relative"}}>
              <span style={{fontSize:14}}>🔔</span>
              {unread>0&&<span style={{position:"absolute",top:2,right:2,width:15,height:15,borderRadius:"50%",
                background:C.brand,fontSize:9,fontWeight:800,color:"#fff",
                display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
            </button>
            {bellOpen&&(
              <div style={{position:"absolute",right:0,top:40,width:320,background:"#fff",
                border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,.12)",
                zIndex:400,overflow:"hidden"}}>
                <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700,color:C.ink}}>Notifications</span>
                  <button onClick={async()=>{
                    await markNotificationsRead(uid);
                    setNotifs(p=>p.map(n=>({...n,read:true})));
                    setBell(false);
                  }} style={{fontSize:11,color:C.brand,fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>
                    Mark all read
                  </button>
                </div>
                <div style={{maxHeight:280,overflowY:"auto"}}>
                  {notifs.length===0
                    ?<div style={{padding:24,textAlign:"center",color:C.muted,fontSize:13}}>No notifications</div>
                    :notifs.map(n=>(
                      <div key={n.id} style={{padding:"10px 16px",borderBottom:`1px solid #FAFAFA`,
                        background:n.read?"#fff":C.brandLt}}>
                        <div style={{fontSize:12,color:C.ink,fontWeight:n.read?400:600,lineHeight:1.45}}>{n.message}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>{fmtDT(n.created_at)}</div>
                      </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{width:1,height:20,background:C.border}}/>
          <Av i={me?.initials||(me?.name?.slice(0,2).toUpperCase())||"??"} s={28}/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.ink,lineHeight:1.2}}>{me?.name?.split(" ")[0]}</div>
            <div style={{fontSize:10,color:C.muted,textTransform:"capitalize"}}>{me?.role?.replace("_"," ")}</div>
          </div>
          <button onClick={handleSignOut} style={{...btn("ghost"),fontSize:11,padding:"4px 9px"}}>Sign out</button>
        </div>
      </header>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* ── SIDEBAR ──────────────────────── */}
        <aside style={{width:210,background:"#fff",borderRight:`1px solid ${C.border}`,
          display:"flex",flexDirection:"column",flexShrink:0}}>
          <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
            {visNav.map(g=>(
              <div key={g.group} style={{marginBottom:4}}>
                <div style={{padding:"8px 16px 3px",fontSize:9,fontWeight:800,color:C.faint,
                  textTransform:"uppercase",letterSpacing:".1em"}}>{g.group}</div>
                {g.items.map(n=>{
                  const active = page===n.key;
                  const isCR   = n.key.includes("change")||n.key.includes("cr_");
                  const ac     = isCR?C.violet:C.brand;
                  return (
                    <button key={n.key} onClick={()=>{setPage(n.key);setBell(false)}} style={{
                      display:"flex",alignItems:"center",gap:9,width:"100%",padding:"8px 16px",
                      border:"none",borderLeft:`2px solid ${active?ac:"transparent"}`,
                      background:active?ac+"0E":"transparent",color:active?ac:C.ink2,
                      fontSize:12,fontWeight:active?700:500,cursor:"pointer",
                      fontFamily:"inherit",textAlign:"left",transition:"all .1s"}}>
                      <span style={{fontSize:13,opacity:active?1:.5}}>{n.icon}</span>
                      {n.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div style={{padding:"11px 14px",borderTop:`1px solid ${C.border}`,background:C.pageBg}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <Av i={me?.initials||(me?.name?.slice(0,2).toUpperCase())||"??"} s={28}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:C.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{me?.name}</div>
                <div style={{fontSize:10,color:C.muted}}>{me?.dept}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── CONTENT ──────────────────────── */}
        <main style={{flex:1,padding:28,overflowY:"auto",maxHeight:"calc(100vh - 52px)"}}
          onClick={()=>bellOpen&&setBell(false)}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/dashboard" element={<Dashboard ctx={ctx} setPage={setPage}/>}/>
            <Route path="/my_requests" element={<MyRequests ctx={ctx}/>}/>
            <Route path="/approvals" element={<Approvals ctx={ctx}/>}/>
            <Route path="/queue" element={<Queue ctx={ctx}/>}/>
            <Route path="/change_requests" element={<ChangePage ctx={ctx}/>}/>
            <Route path="/change_calendar" element={<CalendarPage ctx={ctx}/>}/>
            <Route path="/crapprovals" element={<CRApprovals ctx={ctx}/>}/>
            <Route path="/cr_review" element={<CRReview ctx={ctx}/>}/>
            <Route path="/helpdesk" element={<HelpdeskUser ctx={ctx}/>}/>
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </main>
      </div>

      <Toast t={toast}/>
    </div>
  );
}
