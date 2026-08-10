import { useState } from "react";
import { CheckCircle2, Car, Check, Package, RefreshCw } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { now, humanize } from "../../utils.js";
import { Av, Modal } from "../../components/ui.jsx";

export default function RequestDetailModal({req,usersMap,vehicles,drivers,inventory,onClose,onAction,onAssign,onDeliver}){
  const [note,  setNote]  = useState("");
  const [vehId, setVehId] = useState(req.assigned_vehicle||"");
  const [drvId, setDrvId] = useState(req.assigned_driver||"");
  const [tab,   setTab]   = useState("details");

  const submitter  = usersMap[req.submitted_by];
  const isPending  = req.status==="pending_approval";
  const isApproved = req.status==="approved";
  const isCarReq   = req.type==="pool_car";
  // For pending: only show available. For approved: show available + currently assigned
  const availVeh   = vehicles.filter(v=>v.status==="available" || v.id===req.assigned_vehicle);
  const availDrv   = drivers.filter(d=>d.status==="available"  || d.id===req.assigned_driver);
  const assignedVeh= req.assigned_vehicle ? vehicles.find(v=>v.id===req.assigned_vehicle) : null;
  const assignedDrv= req.assigned_driver  ? drivers.find(d=>d.id===req.assigned_driver)  : null;

  const stationeryItems = isCarReq ? [] : (req.details?.items||[]).map(it=>{
    const inv = inventory.find(x=>x.id===it.id);
    return {name:inv?.name||it.id, qty:it.qty, unit:inv?.unit||"unit"};
  });

  return (
    <Modal title={`Request: ${req.id}`} sub={req.title} onClose={onClose} w={640}>
      {/* Status bar */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,padding:"10px 12px",background:"#F8FAFC",borderRadius:8}}>
        <Av i={submitter?.initials||"?"} s={32}/>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.ink}}>{submitter?.name||"Unknown"}</div>
          <div style={{fontSize:11,color:C.muted}}>{submitter?.dept} · {submitter?.email}</div>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right"}}>
          <div style={{fontSize:11,color:C.muted}}>Submitted {req.created_at ? new Date(req.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—"}</div>
          {req.approved_at&&<div style={{fontSize:11,color:"#059669",fontWeight:600}}>Approved {new Date(req.approved_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>}
          {req.delivered_at&&<div style={{fontSize:11,color:"#2563EB",fontWeight:600}}>Delivered {new Date(req.delivered_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:16}}>
        {["details","history"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",border:"none",borderBottom:`2px solid ${tab===t?C.brand:"transparent"}`,background:"transparent",fontSize:12,fontWeight:tab===t?700:500,color:tab===t?C.brand:C.muted,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>

      {tab==="details"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {isCarReq&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[["Pickup",req.details?.pickup],["Destination",req.details?.destination],["Date",req.details?.date],["Time",`${req.details?.start||""} – ${req.details?.end||""}`],["Passengers",req.details?.passengers],["Purpose",req.details?.purpose]].map(([k,v])=>v?(
                <div key={k} style={{background:"#F8FAFC",borderRadius:7,padding:"10px 12px",gridColumn:k==="Purpose"?"1/-1":"auto"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>{k}</div>
                  <div style={{fontSize:13,color:C.ink,fontWeight:500}}>{String(v)}</div>
                </div>
              ):null)}
            </div>
          )}
          {!isCarReq&&(
            <div style={{background:"#F8FAFC",borderRadius:8,padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Items Requested</div>
              {stationeryItems.map((it,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<stationeryItems.length-1?`1px solid ${C.border}`:"none"}}>
                  <span style={{fontSize:13,color:C.ink,fontWeight:500}}>{it.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.ink}}>{it.qty} {it.unit}s</span>
                </div>
              ))}
              {req.details?.urgency&&<div style={{marginTop:10,fontSize:12,color:C.muted}}>Urgency: <strong>{humanize(req.details.urgency)}</strong></div>}
              {req.details?.notes&&<div style={{marginTop:6,fontSize:12,color:C.muted,fontStyle:"italic"}}>"{req.details.notes}"</div>}
            </div>
          )}
          {assignedVeh&&(
            <div style={{background:"#ECFDF5",border:`1px solid #059669`,borderRadius:8,padding:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"#059669",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={13}/> Vehicle Assigned</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><div style={{fontSize:10,color:"#059669",fontWeight:700,marginBottom:2}}>VEHICLE</div><div style={{fontSize:13,color:C.ink,fontWeight:600}}>{assignedVeh.plate} — {assignedVeh.model}</div></div>
                {assignedDrv&&<div><div style={{fontSize:10,color:"#059669",fontWeight:700,marginBottom:2}}>DRIVER</div><div style={{fontSize:13,color:C.ink,fontWeight:600}}>{assignedDrv.name}<br/><span style={{fontSize:11,color:C.muted}}>{assignedDrv.phone}</span></div></div>}
              </div>
            </div>
          )}
          {(isPending||isApproved)&&isCarReq&&(
            <div style={{border:`1px solid ${isApproved?C.green:C.border}`,borderRadius:8,padding:14,background:isApproved?"#F0FDF4":"#fff"}}>
              <div style={{fontSize:13,fontWeight:700,color:isApproved?C.green:C.ink,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                <Car size={14}/> {isApproved?"Change Vehicle / Driver Assignment":"Assign Vehicle & Driver"}
              </div>
              {availVeh.length===0 && !assignedVeh
                ? <div style={{fontSize:13,color:C.muted}}>No vehicles available right now.</div>
                : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                    <div>
                      <label style={LBL}>Vehicle {isPending&&<span style={{color:C.red}}>*</span>}</label>
                      <select value={vehId} onChange={e=>setVehId(e.target.value)} style={inp()}>
                        <option value="">Select vehicle…</option>
                        {availVeh.map(v=><option key={v.id} value={v.id}>{v.plate} — {v.model} ({v.color}){v.id===req.assigned_vehicle?" (currently assigned)":""}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={LBL}>Driver (optional)</label>
                      <select value={drvId} onChange={e=>setDrvId(e.target.value)} style={inp()}>
                        <option value="">No driver</option>
                        {availDrv.map(d=><option key={d.id} value={d.id}>{d.name} — {d.phone}{d.id===req.assigned_driver?" (currently assigned)":""}</option>)}
                      </select>
                    </div>
                  </div>
              }
              {isApproved&&<div style={{fontSize:11,color:C.green,marginTop:6}}>Changing assignment will notify the requester by email.</div>}
            </div>
          )}
          {isPending&&!isCarReq&&(
            <div>
              <label style={LBL}>Note (optional)</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note for the requester…" style={{...inp(),height:60,resize:"vertical"}}/>
            </div>
          )}
        </div>
      )}

      {tab==="history"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(req.history||[]).length===0&&<div style={{color:C.muted,fontSize:13}}>No history yet.</div>}
          {(req.history||[]).map((h,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"10px 12px",background:"#F8FAFC",borderRadius:7}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:C.brand,marginTop:4,flexShrink:0}}/>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.ink}}>{humanize(h.s)}</div>
                {h.note&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{h.note}</div>}
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{usersMap[h.by]?.name||"System"} · {new Date(h.at).toLocaleString("en-GB")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Close</button>
        {isPending&&isCarReq&&(
          <>
            <button onClick={()=>onAction(req.id,"rejected",note)} style={btn("danger")}>Reject</button>
            <button onClick={()=>vehId&&onAssign(req.id,vehId,drvId)} disabled={!vehId} style={{...btn("primary"),opacity:vehId?1:0.5}}>Assign & Approve →</button>
          </>
        )}
        {isPending&&!isCarReq&&(
          <>
            <button onClick={()=>onAction(req.id,"rejected",note)} style={btn("danger")}>Reject</button>
            <button onClick={()=>onAction(req.id,"approved",note)} style={btn("primary")}><Check size={14}/> Approve</button>
          </>
        )}
        {isApproved&&!isCarReq&&<button onClick={()=>onDeliver(req.id)} style={{...btn("primary"),background:"#059669"}}><Package size={14}/> Mark Delivered</button>}
        {isApproved&&isCarReq&&(
          <>
            {vehId&&vehId!==req.assigned_vehicle&&(
              <button onClick={()=>onAssign(req.id,vehId,drvId)} style={{...btn("primary"),background:C.blue}}><RefreshCw size={14}/> Update Assignment</button>
            )}
            <button onClick={()=>onDeliver(req.id)} style={{...btn("primary"),background:"#059669"}}><CheckCircle2 size={14}/> Mark Complete</button>
          </>
        )}
      </div>
    </Modal>
  );
}

