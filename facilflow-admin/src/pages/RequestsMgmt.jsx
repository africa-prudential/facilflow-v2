import { useState, useMemo } from "react";
import { C, btn, inp, card, LBL } from "../theme.js";
import { now } from "../utils.js";
import { Av, PageTitle, TH, Filters } from "../components/ui.jsx";
import { supabase, updateVehicle, updateInventoryItem, updateRequest } from "../lib/supabase.js";
import RequestDetailModal from "./forms/RequestDetailModal.jsx";

export default function RequestsMgmt({ctx}){
  const {requests,setRequests,users,vehicles,setVehicles,drivers,inventory,setInv,addAudit,flash,uid}=ctx;

  // ── FILTER STATE ─────────────────────────────────────────
  const [search,    setSearch]    = useState("");
  const [fStatus,   setFStatus]   = useState("");
  const [fType,     setFType]     = useState("");
  const [fDept,     setFDept]     = useState("");
  const [fUser,     setFUser]     = useState("");
  const [fDriver,   setFDriver]   = useState("");
  const [fVehicle,  setFVehicle]  = useState("");
  const [fItem,     setFItem]     = useState("");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo,   setFDateTo]   = useState("");
  const [pageSize,  setPageSize]  = useState(25);
  const [page,      setPage]      = useState(1);
  const [selected,  setSel]       = useState(null);

  const usersMap = {};
  (users||[]).forEach(u=>{ usersMap[u.id]=u; });

  const allReqs = requests||[];

  // ── METRICS (always on full dataset) ─────────────────────
  const totalReqs     = allReqs.length;
  const pendingAppr   = allReqs.filter(r=>r.status==="pending_approval").length;
  const pendingProc   = allReqs.filter(r=>r.status==="approved").length;
  const activeFleet   = (vehicles||[]).filter(v=>v.status==="in_use").length;
  const completed     = allReqs.filter(r=>["delivered","fulfilled","completed"].includes(r.status)).length;

  // ── FILTER LOGIC ──────────────────────────────────────────
  const filtered = useMemo(()=>{
    const q = search.toLowerCase();
    return allReqs.filter(r=>{
      const sub = usersMap[r.submitted_by];
      const veh = r.assigned_vehicle ? (vehicles||[]).find(v=>v.id===r.assigned_vehicle) : null;
      const drv = r.assigned_driver  ? (drivers||[]).find(d=>d.id===r.assigned_driver)  : null;
      const items = (r.details?.items||[]).map(it=>(inventory||[]).find(x=>x.id===it.id)?.name||"").join(" ");

      if(fStatus  && r.status!==fStatus)  return false;
      if(fType    && r.type!==fType)      return false;
      if(fDept    && sub?.dept!==fDept)   return false;
      if(fUser    && r.submitted_by!==fUser) return false;
      if(fDriver  && r.assigned_driver!==fDriver) return false;
      if(fVehicle && r.assigned_vehicle!==fVehicle) return false;
      if(fItem    && !(r.details?.items||[]).some(it=>it.id===fItem)) return false;
      if(fDateFrom && new Date(r.created_at) < new Date(fDateFrom)) return false;
      if(fDateTo   && new Date(r.created_at) > new Date(fDateTo+"T23:59:59")) return false;
      if(q){
        const haystack = [r.id, sub?.name||"", veh?.plate||"", drv?.name||"", items].join(" ").toLowerCase();
        if(!haystack.includes(q)) return false;
      }
      return true;
    });
  },[allReqs,search,fStatus,fType,fDept,fUser,fDriver,fVehicle,fItem,fDateFrom,fDateTo,usersMap,vehicles,drivers,inventory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/pageSize));
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  // Reset to page 1 when filters change
  const resetPage = fn => (...args) => { fn(...args); setPage(1); };

  // ── ACTIONS ───────────────────────────────────────────────
  const actionReq = async (id, newStatus, note="") => {
    try {
      const req = allReqs.find(r=>r.id===id);
      // Stock availability check before approving stationery requests
      if(newStatus==="approved" && req.type!=="pool_car"){
        const items=req.details?.items||[];
        for(const it of items){
          const inv=(inventory||[]).find(x=>x.id===it.id);
          if(inv && inv.stock<(it.qty||1)){
            flash(`Insufficient stock for "${inv.name}": ${inv.stock} available, ${it.qty} requested`,"error");
            return;
          }
        }
      }
      const now = new Date().toISOString();
      const history = [...(req.history||[]), {s:newStatus, at:now, by:uid, note}];
      const updates = {
        status: newStatus,
        history,
        ...(newStatus==="approved" ? {approved_by:uid, approved_at:now} : {}),
      };
      const saved = await updateRequest(id, updates);
      setRequests(p=>p.map(r=>r.id===id ? saved : r));
      addAudit("REQUEST_"+newStatus.toUpperCase(), id, `Request ${id} → ${newStatus}`);
      flash(`Request ${newStatus.replace(/_/g," ")}`);
      setSel(null);
      const requester = usersMap[req.submitted_by];
      if(requester?.email){
        try {
          const template = newStatus === "approved" ? "request_approved" : "request_rejected";
          const { data:emailData, error:emailErr } = await supabase.functions.invoke("send-email",{body:{
            template,
            to: requester.email,
            data:{
              requester_name: requester.name,
              request_id:     req.id,
              type:           req.type==="pool_car" ? "Pool Car" : "Stationery",
              title:          req.title,
              approver:       usersMap[uid]?.name || "Admin",
              approved_at:    new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),
              reason:         note || null,
              app_url:        "https://facilflowuser.vercel.app",
            }
          }});
          if(emailErr) flash(`Request ${newStatus} but email failed: ${emailErr.message}`,"error");
          else if(emailData?.error) flash(`Request ${newStatus} but email failed: ${JSON.stringify(emailData.error)}`,"error");
        } catch(emailEx){ flash(`Request ${newStatus} but email error: ${emailEx.message}`,"error"); }
      }
    } catch(e){ flash(e.message,"error"); }
  };

  const assignVehicle = async (id, vehicleId, driverId) => {
    try {
      const req = allReqs.find(r=>r.id===id);
      const now = new Date().toISOString();
      const history = [...(req.history||[]), {s:"approved", at:now, by:uid, note:"Vehicle & driver assigned"}];
      const saved = await updateRequest(id, {status:"approved", history, approved_by:uid, approved_at:now, assigned_vehicle:vehicleId, assigned_driver:driverId||null});
      if(vehicleId) await updateVehicle(vehicleId,{status:"in_use"});
      setRequests(p=>p.map(r=>r.id===id ? saved : r));
      addAudit("REQUEST_ASSIGNED", id, `Vehicle assigned to ${id}`);
      flash("Vehicle assigned & request approved");
      setSel(null);
      const requester = usersMap[req.submitted_by];
      const veh = (vehicles||[]).find(v=>v.id===vehicleId);
      const drv = driverId ? (drivers||[]).find(d=>d.id===driverId) : null;
      if(requester?.email){
        try {
          const { data:emailData, error:emailErr } = await supabase.functions.invoke("send-email",{body:{
            template:"request_approved",
            to: requester.email,
            data:{
              requester_name: requester.name,
              request_id:     req.id,
              type:           "Pool Car",
              title:          req.title,
              approver:       usersMap[uid]?.name || "Admin",
              approved_at:    new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),
              vehicle:        veh ? `${veh.plate} — ${veh.model} (${veh.color})` : null,
              driver:         drv ? `${drv.name} · ${drv.phone}` : null,
              app_url:        "https://facilflowuser.vercel.app",
            }
          }});
          if(emailErr) flash(`Request approved but email failed: ${emailErr.message}`,"error");
          else if(emailData?.error) flash(`Request approved but email failed: ${JSON.stringify(emailData.error)}`,"error");
        } catch(emailEx){ flash(`Request approved but email error: ${emailEx.message}`,"error"); }
      }
    } catch(e){ flash(e.message,"error"); }
  };

  const markDelivered = async (id) => {
    try {
      const req = allReqs.find(r=>r.id===id);
      const now = new Date().toISOString();
      const isCarReq = req.type === "pool_car";
      const statusLabel = isCarReq ? "completed" : "delivered";
      const noteLabel   = isCarReq ? "Trip completed, vehicle returned" : "Items delivered";
      const history = [...(req.history||[]), {s:statusLabel, at:now, by:uid, note:noteLabel}];
      const saved = await updateRequest(id, {status:statusLabel, history, delivered_at:now});
      // Reset vehicle back to available when trip is complete
      if(isCarReq && req.assigned_vehicle){
        await updateVehicle(req.assigned_vehicle, {status:"available"});
        setVehicles(p=>p.map(v=>v.id===req.assigned_vehicle ? {...v,status:"available"} : v));
      }
      // Deduct inventory stock for stationery requests on delivery
      if(!isCarReq){
        const items=req.details?.items||[];
        for(const it of items){
          const inv=(inventory||[]).find(x=>x.id===it.id);
          if(inv){
            const ns=Math.max(0,inv.stock-(it.qty||1));
            try{
              await updateInventoryItem(inv.id,{stock:ns});
              setInv(p=>p.map(i=>i.id!==inv.id?i:{...i,stock:ns}));
            }catch(e){ flash(`Stock update failed for "${inv.name}": ${e.message}`,"error"); }
          }
        }
      }
      setRequests(p=>p.map(r=>r.id===id ? saved : r));
      addAudit("REQUEST_DELIVERED", id, `Request ${id} marked ${statusLabel}`);
      flash("Marked as delivered");
      setSel(null);
    } catch(e){ flash(e.message,"error"); }
  };

  // ── CSV EXPORT ────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID","Type","Requester","Department","Date Requested","Approval Date","Status","Assigned Vehicle","Assigned Driver"];
    const rows = filtered.map(r=>{
      const sub = usersMap[r.submitted_by];
      const veh = r.assigned_vehicle ? (vehicles||[]).find(v=>v.id===r.assigned_vehicle) : null;
      const drv = r.assigned_driver  ? (drivers||[]).find(d=>d.id===r.assigned_driver)  : null;
      return [
        r.id,
        r.type==="pool_car"?"Pool Car":"Stationery",
        sub?.name||"",
        sub?.dept||"",
        r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "",
        r.approved_at ? new Date(r.approved_at).toLocaleDateString("en-GB") : "",
        r.status.replace(/_/g," "),
        veh ? `${veh.plate} ${veh.model}` : "",
        drv?.name||"",
      ];
    });
    const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`facility-requests-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── STATUS COLOR ──────────────────────────────────────────
  const statusColor = s => {
    const map = {
      pending_approval:{bg:"#FFF7ED",color:"#B45309"},
      approved:        {bg:"#ECFDF5",color:"#065F46"},
      rejected:        {bg:"#FEF2F2",color:"#991B1B"},
      in_progress:     {bg:"#EFF6FF",color:"#1D4ED8"},
      delivered:       {bg:"#F0FDF4",color:"#15803D"},
      fulfilled:       {bg:"#EFF6FF",color:"#1D4ED8"},
      cancelled:       {bg:"#F8FAFC",color:"#475569"},
    };
    return map[s]||{bg:"#F8FAFC",color:"#475569"};
  };

  // ── UNIQUE VALUES FOR FILTER DROPDOWNS ────────────────────
  const depts   = [...new Set((users||[]).map(u=>u.dept).filter(Boolean))].sort();
  const invItems = inventory||[];

  const clearFilters = () => {
    setSearch(""); setFStatus(""); setFType(""); setFDept(""); setFUser("");
    setFDriver(""); setFVehicle(""); setFItem(""); setFDateFrom(""); setFDateTo(""); setPage(1);
  };
  const hasFilters = search||fStatus||fType||fDept||fUser||fDriver||fVehicle||fItem||fDateFrom||fDateTo;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <PageTitle title="Facility Requests" sub="Pool car and stationery requests across the organisation"/>

      {/* ── METRIC CARDS ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        {[
          {label:"Total Requests",        value:totalReqs,   sub:"All time",                  active:!fStatus,             onClick:()=>resetPage(setFStatus)("")},
          {label:"Pending Approval",       value:pendingAppr, sub:"Awaiting manager sign-off",  active:fStatus==="pending_approval", onClick:()=>resetPage(setFStatus)(fStatus==="pending_approval"?"":"pending_approval")},
          {label:"Pending Processing",     value:pendingProc, sub:"Approved, needs fulfillment",active:fStatus==="approved",         onClick:()=>resetPage(setFStatus)(fStatus==="approved"?"":"approved")},
          {label:"Active Fleet",           value:activeFleet, sub:"Vehicles currently in use",  active:false,                onClick:()=>{}},
          {label:"Completed",              value:completed,   sub:"Delivered or fulfilled",     active:fStatus==="delivered",        onClick:()=>resetPage(setFStatus)(fStatus==="delivered"?"":"delivered")},
        ].map(({label,value,sub,active,onClick})=>(
          <div key={label} onClick={onClick} style={{
            background:"#fff", border:`1.5px solid ${active?C.brand:C.border}`,
            borderRadius:10, padding:"14px 16px", cursor:"pointer",
            boxShadow: active?`0 0 0 3px ${C.brand}18`:"none",
            transition:"all .15s",
          }}>
            <div style={{fontSize:26,fontWeight:800,color:active?C.brand:C.ink,letterSpacing:"-.03em",lineHeight:1}}>{value}</div>
            <div style={{fontSize:12,fontWeight:700,color:active?C.brand:C.ink,marginTop:6}}>{label}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── FILTER PANEL ── */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:700,color:C.ink}}>Filters</span>
          {hasFilters&&<button onClick={clearFilters} style={{...btn("ghost"),fontSize:11,padding:"3px 10px",color:C.red}}>✕ Clear all</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>
          <div>
            <label style={LBL}>Request Type</label>
            <select value={fType} onChange={e=>resetPage(setFType)(e.target.value)} style={inp()}>
              <option value="">All Types</option>
              <option value="pool_car">Pool Car</option>
              <option value="stationary">Stationery</option>
            </select>
          </div>
          <div>
            <label style={LBL}>Approval Status</label>
            <select value={fStatus} onChange={e=>resetPage(setFStatus)(e.target.value)} style={inp()}>
              <option value="">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="delivered">Delivered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={LBL}>Department</label>
            <select value={fDept} onChange={e=>resetPage(setFDept)(e.target.value)} style={inp()}>
              <option value="">All Departments</option>
              {depts.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Requester</label>
            <select value={fUser} onChange={e=>resetPage(setFUser)(e.target.value)} style={inp()}>
              <option value="">All Users</option>
              {(users||[]).filter(u=>u.role!=="admin").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Assigned Vehicle</label>
            <select value={fVehicle} onChange={e=>resetPage(setFVehicle)(e.target.value)} style={inp()}>
              <option value="">Any Vehicle</option>
              {(vehicles||[]).map(v=><option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Assigned Driver</label>
            <select value={fDriver} onChange={e=>resetPage(setFDriver)(e.target.value)} style={inp()}>
              <option value="">Any Driver</option>
              {(drivers||[]).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Inventory Item</label>
            <select value={fItem} onChange={e=>resetPage(setFItem)(e.target.value)} style={inp()}>
              <option value="">Any Item</option>
              {invItems.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:1}}>
              <label style={LBL}>Date From</label>
              <input type="date" value={fDateFrom} onChange={e=>resetPage(setFDateFrom)(e.target.value)} style={inp()}/>
            </div>
            <div style={{flex:1}}>
              <label style={LBL}>Date To</label>
              <input type="date" value={fDateTo} onChange={e=>resetPage(setFDateTo)(e.target.value)} style={inp()}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH + EXPORT BAR ── */}
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14}}>🔍</span>
          <input
            value={search}
            onChange={e=>resetPage(setSearch)(e.target.value)}
            placeholder="Search by request ID, requester name, vehicle plate, driver, item…"
            style={{...inp(),paddingLeft:32,width:"100%"}}
          />
        </div>
        <div style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{filtered.length} result{filtered.length!==1?"s":""}</div>
        <button onClick={exportCSV} style={{...btn("ghost"),fontSize:12,padding:"7px 14px",whiteSpace:"nowrap"}}>⬇ Export CSV</button>
      </div>

      {/* ── TABLE ── */}
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["ID","Type","Requester","Dept","Date Requested","Last Updated","Status","Resource","Action"]}/>
          <tbody>
            {paged.length===0&&(
              <tr><td colSpan={9} style={{padding:"48px",textAlign:"center",color:C.muted,fontSize:13}}>
                {hasFilters?"No requests match your filters.":"No requests yet."}
              </td></tr>
            )}
            {paged.map((r,i)=>{
              const sub = usersMap[r.submitted_by];
              const veh = r.assigned_vehicle ? (vehicles||[]).find(v=>v.id===r.assigned_vehicle) : null;
              const drv = r.assigned_driver  ? (drivers||[]).find(d=>d.id===r.assigned_driver)  : null;
              const sc  = statusColor(r.status);
              const resource = veh
                ? `${veh.plate}${drv?` · ${drv.name.split(" ")[0]}`:""}`
                : r.type!=="pool_car" && (r.details?.items||[]).length>0
                  ? `${(r.details.items||[]).length} item${(r.details.items||[]).length>1?"s":""}`
                  : "—";
              return (
                <tr key={r.id}
                  onClick={()=>setSel(r)}
                  style={{borderBottom:i<paged.length-1?`1px solid #F1F5F9`:"none",cursor:"pointer"}}
                >
                  <td style={{padding:"11px 14px",fontSize:11,fontWeight:700,color:C.ink}}>{r.id}</td>
                  <td style={{padding:"11px 14px"}}>
                    <span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:5,
                      background:r.type==="pool_car"?"#FEF2F2":"#EFF6FF",
                      color:r.type==="pool_car"?C.brand:"#2563EB"}}>
                      {r.type==="pool_car"?"🚗 Pool Car":"✏️ Stationery"}
                    </span>
                  </td>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <Av i={sub?.initials||"?"} s={26}/>
                      <span style={{fontSize:12,fontWeight:600,color:C.ink}}>{sub?.name||"Unknown"}</span>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted}}>{sub?.dept||"—"}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>
                    {r.updated_at ? new Date(r.updated_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                  </td>
                  <td style={{padding:"11px 14px"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:sc.bg,color:sc.color,textTransform:"capitalize",whiteSpace:"nowrap"}}>
                      {r.status.replace(/_/g," ")}
                    </span>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted}}>{resource}</td>
                  <td style={{padding:"11px 14px"}}>
                    <button
                      onClick={e=>{e.stopPropagation();setSel(r);}}
                      style={{...btn(r.status==="pending_approval"?"primary":"ghost"),fontSize:11,padding:"4px 12px"}}>
                      {r.status==="pending_approval"?"Action →":"View →"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── PAGINATION ── */}
        <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:C.muted}}>Rows per page:</span>
            <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1);}} style={{...inp(),width:70,padding:"4px 8px",fontSize:12}}>
              {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {/*<div style={{fontSize:11,color:C.muted}}>*/}
          {/*  {filtered.length===0?"0 results":`${(page-1)*pageSize+1}–${Math.min(page*pageSize,filtered.length)} of ${filtered.length}`}*/}
          {/*</div>*/}
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>setPage(1)}      disabled={page===1}          style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>«</button>
            <button onClick={()=>setPage(p=>p-1)} disabled={page===1}          style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>‹</button>
            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
              const pg = Math.max(1,Math.min(page-2,totalPages-4))+i;
              if(pg<1||pg>totalPages) return null;
              return <button key={pg} onClick={()=>setPage(pg)} style={{...btn(pg===page?"primary":"ghost"),padding:"4px 10px",fontSize:12,minWidth:32}}>{pg}</button>;
            })}
            <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>›</button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>»</button>
          </div>
        </div>
      </div>

      {selected&&(
        <RequestDetailModal
          req={selected}
          usersMap={usersMap}
          vehicles={vehicles||[]}
          drivers={drivers||[]}
          inventory={inventory||[]}
          onClose={()=>setSel(null)}
          onAction={actionReq}
          onAssign={assignVehicle}
          onDeliver={markDelivered}
        />
      )}
    </div>
  );
}


