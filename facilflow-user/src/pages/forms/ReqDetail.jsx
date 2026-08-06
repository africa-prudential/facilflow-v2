import { useState } from "react";
import { CheckCircle2, Check } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { REQ_STATUS } from "../../constants.js";
import { fmtDT, fmtD } from "../../utils.js";
import { RQChip, Modal } from "../../components/ui.jsx";

export default function ReqDetail({req,onClose,ctx}){
  const {uid,transReq,me,invItems,users}=ctx;
  // vehicles and drivers may be array or object — normalize safely
  const vehList = Array.isArray(ctx.vehicles) ? ctx.vehicles : (ctx.vehicles?.data || []);
  const drvList = Array.isArray(ctx.drivers)  ? ctx.drivers  : (ctx.drivers?.data  || []);
  const [note,setNote]=useState("");
  const [tab,setTab]=useState("details");
  const canApprove  = me.role==="manager"       && req.status==="pending_approval";
  const canProcess  = me.role==="resource_team" && req.status==="approved";
  const canComplete = me.role==="resource_team" && req.status==="in_progress";

  const assignedVeh = req.assigned_vehicle ? vehList.find(v=>v.id===req.assigned_vehicle) : null;
  const assignedDrv = req.assigned_driver  ? drvList.find(d=>d.id===req.assigned_driver)  : null;

  const renderDetails = () => {
    if(req.type==="pool_car"){
      const d = req.details||{};
      return (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["Pickup",d.pickup],["Destination",d.destination],["Date",d.date],["Time",`${d.start||""} – ${d.end||""}`],["Passengers",d.passengers!=null?String(d.passengers):null],["Purpose",d.purpose]].map(([k,v])=>v!=null&&v!==""?(
            <div key={k} style={{background:C.pageBg,borderRadius:7,padding:"10px 12px",gridColumn:k==="Purpose"?"1/-1":"auto"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>{k}</div>
              <div style={{fontSize:13,color:C.ink,fontWeight:500}}>{String(v)}</div>
            </div>
          ):null)}
          {assignedVeh&&(
            <div style={{gridColumn:"1/-1",background:"#ECFDF5",border:"1px solid #059669",borderRadius:8,padding:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"#059669",marginBottom:6,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={14}/> Vehicle Assigned</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><div style={{fontSize:10,color:"#059669",fontWeight:700,marginBottom:2}}>VEHICLE</div><div style={{fontSize:13,color:C.ink,fontWeight:600}}>{assignedVeh.plate} — {assignedVeh.model}</div></div>
                {assignedDrv&&<div><div style={{fontSize:10,color:"#059669",fontWeight:700,marginBottom:2}}>DRIVER</div><div style={{fontSize:13,color:C.ink,fontWeight:600}}>{assignedDrv.name} · {assignedDrv.phone}</div></div>}
              </div>
            </div>
          )}
        </div>
      );
    }
    // Stationery
    const d = req.details||{};
    const itemsList = (d.items||[]).map(it=>{ const inv=invItems.find(x=>x.id===it.id); return {name:inv?.name||it.id,qty:it.qty,unit:inv?.unit||"unit"}; });
    return (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {d.urgency&&<div style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Urgency</div><div style={{fontSize:13,color:C.ink,fontWeight:500,textTransform:"capitalize"}}>{d.urgency}</div></div>}
        <div style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Items Requested</div>
          {itemsList.map((it,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<itemsList.length-1?`1px solid ${C.border}`:"none"}}>
              <span style={{fontSize:13,color:C.ink}}>{it.name}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.ink}}>{it.qty} {it.unit}s</span>
            </div>
          ))}
        </div>
        {d.notes&&<div style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>Notes</div><div style={{fontSize:13,color:C.ink}}>{d.notes}</div></div>}
      </div>
    );
  };

  return (
    <Modal title={req.id} sub={req.title} onClose={onClose} w={700}>
      {/* Status bar */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,padding:"10px 12px",background:C.pageBg,borderRadius:8}}>
        <RQChip s={req.status}/>
        <span style={{fontSize:11,color:C.muted}}>Submitted {fmtD(req.created_at)}</span>
        {req.approved_at&&<span style={{fontSize:11,color:C.muted}}>· Approved {fmtD(req.approved_at)}</span>}
        {req.delivered_at&&<span style={{fontSize:11,color:"#059669",fontWeight:600}}>· Delivered {fmtD(req.delivered_at)}</span>}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`,marginBottom:16}}>
        {["details","timeline"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",border:"none",borderBottom:`2px solid ${tab===t?C.brand:"transparent"}`,background:"transparent",fontSize:12,fontWeight:tab===t?700:500,color:tab===t?C.brand:C.muted,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>

      {tab==="details" && renderDetails()}

      {tab==="timeline"&&(
        <div style={{position:"relative",paddingLeft:20}}>
          <div style={{position:"absolute",left:7,top:6,bottom:6,width:2,background:C.border}}/>
          {(req.history||[]).map((h,i)=>{
            const m=REQ_STATUS[h.s]||{color:C.muted};
            return (
              <div key={i} style={{position:"relative",marginBottom:14}}>
                <div style={{position:"absolute",left:-17,width:10,height:10,borderRadius:"50%",background:m.color,border:"2px solid #fff",top:2}}/>
                <div style={{fontSize:11,fontWeight:600,color:m.color,textTransform:"capitalize"}}>{h.s.replace(/_/g," ")}</div>
                <div style={{fontSize:10,color:C.muted}}>{fmtDT(h.at)} · {users[h.by]?.name||"System"}</div>
                {h.note&&<div style={{fontSize:11,color:C.ink2,marginTop:2,fontStyle:"italic"}}>"{h.note}"</div>}
              </div>
            );
          })}
        </div>
      )}

      {(canApprove||canProcess||canComplete)&&(
        <div style={{marginTop:14}}>
          <label style={LBL}>Comment (optional)</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} style={{...inp(),minHeight:52,resize:"vertical"}} placeholder="Add a note…"/>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        {canApprove&&<><button onClick={()=>{transReq(req.id,"rejected",note);onClose()}} style={btn("ghost")}>Reject</button>
          <button onClick={()=>{transReq(req.id,"approved",note);onClose()}} style={btn("success")}><Check size={14}/> Approve</button></>}
        {canProcess&&<button onClick={()=>{transReq(req.id,"in_progress");onClose()}} style={btn("primary")}>▶ Process</button>}
        {canComplete&&<button onClick={()=>{transReq(req.id,"completed");onClose()}} style={btn("success")}><Check size={14}/> Mark Complete</button>}
        <button onClick={onClose} style={btn("ghost")}>Close</button>
      </div>
    </Modal>
  );
}

