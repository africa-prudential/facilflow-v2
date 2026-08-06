import { supabase } from "./lib/supabase.js";
import { fetchUsers, fetchVehicles, fetchDrivers, fetchInventory, fetchRequests, fetchCRs, fetchAuditLog, addAuditEntry, fetchChangeRoles, fetchUserChangeRoles, fetchApprovalLevels, fetchTenantConfig, fetchVehicleDocs, fetchSubscriptions, fetchTickets, updateTicket, fetchTicketComments, addTicketComment, fetchAssets, createAsset, updateAsset, fetchTicketCategories } from "./lib/supabase.js";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { C, btn } from "./theme.js";
import { NAV, ADMIN_ROLE_META } from "./constants.js";
import { getAdminRoles, hasAdminAccess, genId, normCR, normVeh, normSub, normDrv, normInv, normAudit, normTicket } from "./utils.js";
import { Av, AccessDenied } from "./components/ui.jsx";
import { toast } from "sonner";
import AdminDash from "./pages/AdminDash.jsx";
import RequestsMgmt from "./pages/RequestsMgmt.jsx";
import UserMgmt from "./pages/UserMgmt.jsx";
import FleetMgmt from "./pages/FleetMgmt.jsx";
import DriverRoster from "./pages/DriverRoster.jsx";
import InventoryMgmt from "./pages/InventoryMgmt.jsx";
import CRAdmin from "./pages/CRAdmin.jsx";
import CRPolicy from "./pages/CRPolicy.jsx";
import ChangeConfig from "./pages/ChangeConfig.jsx";
import NotifPolicy from "./pages/NotifPolicy.jsx";
import ITSubscriptions from "./pages/ITSubscriptions.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import HelpdeskAdmin from "./pages/HelpdeskAdmin.jsx";
import AssetRegistry from "./pages/AssetRegistry.jsx";

export default function AdminApp({ currentUser }){
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.replace(/^\//,"") || "dashboard";
  const setPage = useCallback((key)=>navigate(`/${key}`),[navigate]);
  const [users,     setUsers]    = useState([]);
  const [vehicles,  setVehicles] = useState([]);
  const [drivers,   setDrivers]  = useState([]);
  const [inventory, setInv]      = useState([]);
  const [requests,  setRequests] = useState([]);
  const [crs,       setCrs]      = useState([]);
  const [audit,       setAudit]      = useState([]);
  const [changeRoles,   setChangeRoles]   = useState([]);
  const [userCRoles,    setUserCRoles]    = useState([]);
  const [approvalLevels,setApprovalLevels]= useState([]);
  const [tenantConfig,  setTenantConfig]  = useState(null);
  const [vehicleDocs, setVehicleDocs] = useState([]);
  const [subscriptions, setSubs]      = useState([]);
  const [tickets,    setTickets]   = useState([]);
  const [assets,     setAssets]    = useState([]);
  const [ticketCats, setTicketCats]= useState([]);
  const [loading,   setLoading]  = useState(true);

  const me  = currentUser;
  const tid = me?.tenant_id;
  const uid = me?.id;

  // ── LOAD ALL DATA ─────────────────────────────────────────
  useEffect(()=>{
    if(!tid) return;
    Promise.all([
      fetchUsers(tid),
      fetchVehicles(tid),
      fetchDrivers(tid),
      fetchInventory(tid),
      fetchRequests(tid),
      fetchCRs(tid),
      fetchAuditLog(tid),
    ]).then(([u,v,d,inv,reqs,cr,al])=>{
      setUsers(u||[]);
      setVehicles((v||[]).map(normVeh));
      setDrivers((d||[]).map(normDrv));
      setInv((inv||[]).map(normInv));
      setRequests(reqs||[]);
      setCrs((cr||[]).map(normCR));
      setAudit((al||[]).map(normAudit));
    }).catch(console.error)
    .finally(()=>setLoading(false));

    // Load new compliance/subscription data (non-fatal — tables may not exist yet)
    Promise.all([
      fetchVehicleDocs(tid),
      fetchSubscriptions(tid),
    ]).then(([vdocs,subs])=>{
      setVehicleDocs(vdocs||[]);
      setSubs((subs||[]).map(normSub));
    }).catch(e=>console.warn("Compliance/subscription data load:", e.message));

    // Load helpdesk and asset data (non-fatal — tables may not exist yet)
    Promise.all([fetchTickets(tid), fetchAssets(tid), fetchTicketCategories(tid)])
      .then(([tix,ast,cats])=>{ setTickets((tix||[]).map(normTicket)); setAssets(ast||[]); setTicketCats(cats||[]); })
      .catch(e=>console.warn("Helpdesk/Asset data load:", e.message));

    // Load change management config (non-fatal)
    Promise.all([
      fetchChangeRoles(),
      fetchUserChangeRoles(tid),
      fetchApprovalLevels(tid),
      fetchTenantConfig(tid),
    ]).then(([cr2,ucr,al2,tc])=>{
      setChangeRoles(cr2||[]);
      setUserCRoles(ucr||[]);
      setApprovalLevels(al2||[]);
      setTenantConfig(tc);
    }).catch(e=>console.warn("Change config load:", e.message));
  },[tid]);

  const flash = useCallback((msg,type="success")=>{
    type==="error" ? toast.error(msg) : toast.success(msg);
  },[]);

  // ── ADD AUDIT ENTRY ───────────────────────────────────────
  const addAuditFn = useCallback(async(action,target,detail)=>{
    const entry = {
      tenant_id:tid, performed_by:uid,
      action, target, detail,
    };
    try {
      await addAuditEntry(entry);
      setAudit(p=>[{...entry, id:genId("AL"), created_at:new Date().toISOString()},...p]);
    } catch(e){ console.error("Audit error:",e); }
  },[tid,uid]);

  const updateTicketFn  = useCallback(async(id,upd)=>{ const saved=await updateTicket(id,upd); const n=normTicket(saved); setTickets(p=>p.map(t=>t.id===id?n:t)); return n; },[]);
  const createAssetFn   = useCallback(async(data)=>{ const saved=await createAsset({...data,tenant_id:tid}); setAssets(p=>[...p,saved]); return saved; },[tid]);
  const updateAssetFn   = useCallback(async(id,upd)=>{ const saved=await updateAsset(id,upd); setAssets(p=>p.map(a=>a.id===id?saved:a)); return saved; },[]);
  const addCommentFn    = useCallback(async(comment)=>addTicketComment(comment),[]);
  const fetchCommentsFn = useCallback(async(ticketId)=>fetchTicketComments(ticketId),[]);

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"system-ui",color:C.muted,fontSize:14,background:C.pageBg}}>
      Loading Admin Console…
    </div>
  );

  const adminRoles = getAdminRoles(me);

  const ctx={
    me, tid, uid,
    adminRoles,
    users, setUsers,
    vehicles, setVehicles,
    drivers, setDrivers,
    inventory, setInv,
    requests, setRequests,
    crs, setCrs,
    audit, addAudit:addAuditFn,
    flash,
    adminUser: me,
    changeRoles, setChangeRoles,
    userCRoles, setUserCRoles,
    approvalLevels, setApprovalLevels,
    tenantConfig, setTenantConfig,
    vehicleDocs, setVehicleDocs,
    subscriptions, setSubs,
    tickets, setTickets, assets, setAssets, ticketCats, setTicketCats,
    updateTicketFn, createAssetFn, updateAssetFn, addCommentFn, fetchCommentsFn,
  };

  return (
    <div style={{minHeight:"100vh",background:C.pageBg,fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}
        input:focus,select:focus,textarea:focus{outline:none;border-color:${C.brand}!important;box-shadow:0 0 0 2.5px ${C.brand}18!important}
        button:hover{opacity:.88} tr:hover>td{background:#FAFAFA}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:${C.borderDk};border-radius:4px}
        @keyframes slideUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}
      </style>

      {/* ── TOPBAR ── */}
      <header style={{height:52,background:C.sidebar,borderBottom:"1px solid #1E293B",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,position:"sticky",top:0,zIndex:200}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:30,height:30,borderRadius:7,background:C.brand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",letterSpacing:"-.05em"}}>AP</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:"-.02em",lineHeight:1.1}}>Africa Prudential</div>
            <div style={{fontSize:9,color:"#64748B",fontWeight:600,letterSpacing:".06em",textTransform:"uppercase"}}>Admin Console</div>
          </div>
          {adminRoles.map(r=>{
            const m = ADMIN_ROLE_META[r] || {label:r,color:C.brand,bg:C.brandLt};
            return <div key={r} style={{marginLeft:4,padding:"2px 10px",borderRadius:20,background:m.color,fontSize:10,fontWeight:700,color:"#fff",letterSpacing:".04em",textTransform:"uppercase"}}>{m.label}</div>;
          })}
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{fontSize:11,color:"#94A3B8",fontWeight:500}}>Tenant: Africa Prudential Plc</div>
          <div style={{width:1,height:18,background:"#334155"}}/>
          <Av i={me?.initials||"AD"} s={28}/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{me?.name?.split(" ")[0]}</div>
            <div style={{fontSize:10,color:"#64748B",textTransform:"capitalize"}}>
              {adminRoles.map(r=>ADMIN_ROLE_META[r]?.label||r).join(" · ")}
            </div>
          </div>
          <button onClick={()=>{supabase.auth.signOut();toast.success("Signed out");}} style={{...btn("ghost"),fontSize:11,padding:"4px 9px",marginLeft:4,color:"#94A3B8",borderColor:"#334155"}}>Sign out</button>
        </div>
      </header>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* ── SIDEBAR ── */}
        <aside style={{width:210,background:C.sidebar,display:"flex",flexDirection:"column",flexShrink:0}}>
          <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
            {NAV.filter(g=>hasAdminAccess(me, g.roles)).map(g=>(
              <div key={g.group} style={{marginBottom:4}}>
                <div style={{padding:"8px 16px 3px",fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:".1em"}}>{g.group}</div>
                {g.items.map(n=>{
                  const active=page===n.k;
                  return (
                    <button key={n.k} onClick={()=>setPage(n.k)} style={{
                      display:"flex",alignItems:"center",gap:9,width:"100%",padding:"8px 16px",
                      border:"none",borderLeft:`2px solid ${active?C.brand:"transparent"}`,
                      background:active?"rgba(200,16,46,.12)":"transparent",
                      color:active?"#fff":"#94A3B8",
                      fontSize:12,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                      <n.icon size={14} style={{flexShrink:0}}/>{n.l}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div style={{padding:"11px 14px",borderTop:"1px solid #1E293B"}}>
            <div style={{fontSize:11,color:"#475569",fontWeight:500}}>v2.0 · Admin Platform</div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <main style={{flex:1,padding:28,overflowY:"auto",maxHeight:"calc(100vh - 52px)"}}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/dashboard" element={<AdminDash ctx={ctx} setPage={setPage}/>}/>
            <Route path="/users" element={hasAdminAccess(me,["super_admin"]) ? <UserMgmt ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/requests" element={hasAdminAccess(me,["super_admin","facility_admin"]) ? <RequestsMgmt ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/fleet" element={hasAdminAccess(me,["super_admin","facility_admin"]) ? <FleetMgmt ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/drivers" element={hasAdminAccess(me,["super_admin","facility_admin"]) ? <DriverRoster ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/inventory" element={hasAdminAccess(me,["super_admin","facility_admin"]) ? <InventoryMgmt ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/change_requests" element={hasAdminAccess(me,["super_admin","it_admin"]) ? <CRAdmin ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/cr_policy" element={hasAdminAccess(me,["super_admin","it_admin"]) ? <CRPolicy ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/change_config" element={hasAdminAccess(me,["super_admin","it_admin"]) ? <ChangeConfig ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/it_subscriptions" element={hasAdminAccess(me,["super_admin","it_admin"]) ? <ITSubscriptions ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/helpdesk" element={hasAdminAccess(me,["super_admin","it_admin"]) ? <HelpdeskAdmin ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/asset_registry" element={hasAdminAccess(me,["super_admin","it_admin"]) ? <AssetRegistry ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/notifications" element={hasAdminAccess(me,["super_admin"]) ? <NotifPolicy ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="/audit" element={hasAdminAccess(me,["super_admin"]) ? <AuditLog ctx={ctx}/> : <AccessDenied/>}/>
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </main>
      </div>
    </div>
  );
}
