import { useState } from "react";
import { C, btn, inp, LBL } from "../../theme.js";
import { fmtDT, fmtD, now } from "../../utils.js";
import { CRChip, EnvTag, RiskTag, Modal } from "../../components/ui.jsx";
import { updateCR } from "../../lib/supabase.js";

export default function AdminCRDetailModal({cr, onClose, ctx, uniqueUsers, stageLabel}){
  const {uid, crs, setCrs, flash, userCRoles, approvalLevels} = ctx;
  const [tab,       setTab]     = useState("details");
  const [note,      setNote]    = useState("");
  const [implNotes, setImplNotes]= useState(cr.implementation_notes||"");
  const [outcome,   setOutcome] = useState(cr.implementation_outcome||"successful");
  const [saving,    setSaving]  = useState(false);

  // Check what roles the logged-in admin has in change management
  const myChangRoles = (userCRoles||[]).filter(r=>r.user_id===uid).map(r=>r.role_key);
  const isMgr     = myChangRoles.includes("change_manager")     || cr.status==="pending_manager";   // admin can always act as manager
  const isApprL1  = myChangRoles.includes("change_approver_l1") || cr.current_stage==="pending_level_1";
  const isApprL2  = myChangRoles.includes("change_approver_l2") || cr.current_stage==="pending_level_2";
  const isImpl    = myChangRoles.includes("change_implementer")  || cr.status==="pending_implementation"||cr.status==="in_progress";

  // What can this admin actually do right now?
  const canMgrApprove   = cr.status==="pending_manager";
  const canL1Approve    = cr.current_stage==="pending_level_1";
  const canL2Approve    = cr.current_stage==="pending_level_2";
  const canStartImpl    = cr.status==="pending_implementation";
  const canCompleteImpl = cr.status==="in_progress";
  const canClose        = cr.status==="completed";
  const hasAction = canMgrApprove||canL1Approve||canL2Approve||canStartImpl||canCompleteImpl||canClose;

  const raiser = uniqueUsers.find(u=>u.id===cr.initiator);
  const levels = cr.level_approvals||[];

  const doAction = async (action) => {
    setSaving(true);
    try {
      const iso = new Date().toISOString();
      let nextStatus = cr.status;
      let nextStage  = cr.current_stage;
      let nextLevel  = cr.current_level||0;
      let updatedLevels = [...levels];
      let newHistory = [...(cr.history||[])];
      let extra = {};

      if(action==="reject"){
        nextStatus="rejected"; nextStage="rejected";
        newHistory.push({s:"rejected",at:iso,by:uid,label:"Rejected by Admin",note});
      }
      else if(action==="approve_manager"){
        if(levels.length>0){
          nextStatus="pending_approval"; nextStage="pending_level_1"; nextLevel=1;
          newHistory.push({s:"pending_approval",at:iso,by:uid,label:"Approved by Change Manager",note});
        } else {
          nextStatus="pending_implementation"; nextStage="pending_implementation";
          newHistory.push({s:"pending_implementation",at:iso,by:uid,label:"Approved — no approval levels configured",note});
        }
      }
      else if(action==="approve_level"){
        const curIdx = (cr.current_level||1)-1;
        updatedLevels = levels.map((l,i)=>i===curIdx?{...l,status:"approved",approver_id:uid,approved_at:iso,note}:l);
        newHistory.push({s:`level_${cr.current_level}_approved`,at:iso,by:uid,label:`Level ${cr.current_level} Approved`,note});
        const nextLvl = levels[curIdx+1];
        if(nextLvl){ nextStatus="pending_approval"; nextStage=`pending_level_${nextLvl.level}`; nextLevel=nextLvl.level; }
        else { nextStatus="pending_implementation"; nextStage="pending_implementation"; }
        extra.level_approvals=updatedLevels;
      }
      else if(action==="start_implementation"){
        nextStatus="in_progress"; nextStage="in_progress";
        newHistory.push({s:"in_progress",at:iso,by:uid,label:"Implementation started"});
        extra.implementation_started_at=iso;
      }
      else if(action==="complete_implementation"){
        nextStatus=outcome==="failed"?"failed":"completed"; nextStage=nextStatus;
        newHistory.push({s:nextStatus,at:iso,by:uid,label:`Implementation ${outcome}`,note});
        extra.implementation_completed_at=iso;
        extra.implementation_notes=implNotes;
        extra.implementation_outcome=outcome;
      }
      else if(action==="close"){
        nextStatus="closed"; nextStage="closed";
        newHistory.push({s:"closed",at:iso,by:uid,label:"Closed by Admin"});
      }

      const saved = await updateCR(cr.id,{
        ...extra, status:nextStatus, current_stage:nextStage,
        current_level:nextLevel, history:newHistory,
        updated_at:new Date().toISOString(),
      });
      setCrs(p=>p.map(c=>c.id===cr.id?saved:c));
      flash(`CR ${nextStatus.replace(/_/g," ")}`);
      onClose();
    } catch(e){ flash(e.message,"error"); }
    finally { setSaving(false); }
  };

  // Stage tracker
  const stages = [
    {label:"Submitted",  done:true,                                      at:cr.created_at},
    {label:"Mgr Review", done:cr.status!=="pending_manager"&&cr.status!=="rejected", active:cr.status==="pending_manager"},
    ...(levels.map(l=>({label:l.name, done:l.status==="approved", active:cr.current_stage===`pending_level_${l.level}`, at:l.approved_at}))),
    {label:"Implementation", done:["completed","closed"].includes(cr.status), active:cr.status==="pending_implementation"||cr.status==="in_progress"},
    {label:"Closed",     done:cr.status==="closed"},
  ];

  return (
    <Modal title={`${cr.id}${cr.version>1?` v${cr.version}`:""}`} sub={cr.title} onClose={onClose} w={820}>

      {/* Header badges */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,padding:"10px 12px",background:C.pageBg,borderRadius:8}}>
        <CRChip s={cr.status}/>
        <EnvTag e={cr.environment}/>
        <RiskTag r={cr.risk_level||cr.riskLevel}/>
        <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:4,background:C.surface,color:C.ink2}}>{cr.change_type||cr.changeType}</span>
        {(cr.is_emergency||cr.isEmergency)&&<span style={{fontSize:11,fontWeight:700,color:C.red,background:C.redBg,padding:"2px 8px",borderRadius:4}}>⚡ Emergency</span>}
        {hasAction&&<span style={{fontSize:11,fontWeight:700,color:C.brand,background:C.brandLt,padding:"2px 8px",borderRadius:4,marginLeft:"auto"}}>⚡ Action Required</span>}
      </div>

      {/* Stage tracker */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:12}}>Change Progress</div>
        <div style={{display:"flex",alignItems:"flex-start",overflowX:"auto",gap:0}}>
          {stages.map((s,i)=>{
            const color = s.done?C.green:s.active?C.brand:C.muted;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                    background:s.done?C.green:s.active?C.brand:C.border,color:s.done||s.active?"#fff":C.muted,
                    fontSize:12,fontWeight:700,boxShadow:s.active?`0 0 0 3px ${C.brand}25`:"none"}}>
                    {s.done?"✓":s.active?"●":"○"}
                  </div>
                  <div style={{fontSize:9,fontWeight:700,color,textAlign:"center",whiteSpace:"nowrap",maxWidth:64,overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
                  {s.at&&s.done&&<div style={{fontSize:8,color:C.muted}}>{fmtD(s.at)}</div>}
                  {s.active&&<div style={{fontSize:8,color:C.brand,fontWeight:700}}>Now</div>}
                </div>
                {i<stages.length-1&&<div style={{flex:1,height:2,background:s.done?C.green:C.border,marginBottom:18,minWidth:8}}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:14}}>
        {["details","approvals","history"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 14px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===t?700:500,background:"transparent",color:tab===t?C.brand:C.muted,borderBottom:tab===t?`2px solid ${C.brand}`:"2px solid transparent",marginBottom:-1,textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>

      {tab==="details"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["Change Type",cr.change_type||cr.changeType],["Risk Level",cr.risk_level||cr.riskLevel],["Environment",cr.environment],["Category",cr.category],["System",cr.system_name||cr.systemName],["Deploy Date",cr.deploy_date||cr.deployDate],["Deploy Window",`${cr.deploy_start||""} – ${cr.deploy_end||""}`],["Raised By",raiser?.name||"—"]].filter(([,v])=>v).map(([k,v])=>(
              <div key={k} style={{background:C.pageBg,borderRadius:7,padding:"9px 12px"}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{k}</div>
                <div style={{fontSize:12,color:C.ink,fontWeight:500}}>{String(v)}</div>
              </div>
            ))}
          </div>
          {cr.description&&<div style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Description</div><div style={{fontSize:13,color:C.ink,lineHeight:1.6}}>{cr.description}</div></div>}
          {cr.rollback&&<div style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Rollback Plan</div><div style={{fontSize:13,color:C.ink,lineHeight:1.6}}>{cr.rollback}</div></div>}
          {cr.test_evidence&&<div style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Testing Evidence</div><div style={{fontSize:13,color:C.ink,lineHeight:1.6}}>{cr.test_evidence}</div></div>}
        </div>
      )}

      {tab==="approvals"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{background:C.pageBg,borderRadius:8,padding:12}}>
            <div style={{fontSize:11,fontWeight:700,color:C.ink,marginBottom:6}}>Change Manager</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.muted}}>{uniqueUsers.find(u=>u.id===cr.change_manager_id)?.name||"Not assigned"}</span>
              <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
                background:cr.status==="pending_manager"?C.amberBg:cr.status==="rejected"?C.redBg:C.greenBg,
                color:cr.status==="pending_manager"?C.amber:cr.status==="rejected"?C.red:C.green}}>
                {cr.status==="pending_manager"?"Pending":cr.status==="rejected"?"Rejected":"Approved ✓"}
              </span>
            </div>
          </div>
          {levels.map((l,i)=>(
            <div key={i} style={{background:C.pageBg,borderRadius:8,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:11,fontWeight:700,color:C.ink}}>{l.name}</div>
                <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
                  background:l.status==="approved"?C.greenBg:cr.current_stage===`pending_level_${l.level}`?C.amberBg:"#F8FAFC",
                  color:l.status==="approved"?C.green:cr.current_stage===`pending_level_${l.level}`?C.amber:C.muted}}>
                  {l.status==="approved"?`Approved ✓ — ${fmtD(l.approved_at)}`:cr.current_stage===`pending_level_${l.level}`?"Pending":"Awaiting"}
                </span>
              </div>
              {l.note&&<div style={{fontSize:11,color:C.muted,marginTop:4,fontStyle:"italic"}}>"{l.note}"</div>}
            </div>
          ))}
        </div>
      )}

      {tab==="history"&&(
        <div style={{position:"relative",paddingLeft:18,maxHeight:260,overflowY:"auto"}}>
          <div style={{position:"absolute",left:6,top:6,bottom:6,width:2,background:C.border}}/>
          {(cr.history||[]).map((h,i)=>(
            <div key={i} style={{position:"relative",marginBottom:12}}>
              <div style={{position:"absolute",left:-16,width:10,height:10,borderRadius:"50%",background:C.brand,border:"2px solid #fff",top:2}}/>
              <div style={{fontSize:11,fontWeight:600,color:C.ink,textTransform:"capitalize"}}>{(h.label||h.s).replace(/_/g," ")}</div>
              <div style={{fontSize:10,color:C.muted}}>{fmtDT(h.at)} · {uniqueUsers.find(u=>u.id===h.by)?.name||"System"}</div>
              {h.note&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic",marginTop:1}}>"{h.note}"</div>}
            </div>
          ))}
        </div>
      )}

      {/* Action section */}
      {hasAction&&(
        <div style={{marginTop:14,border:`1px solid ${C.brand}30`,borderRadius:8,padding:14,background:C.brandLt}}>
          <div style={{fontSize:12,fontWeight:700,color:C.brand,marginBottom:10}}>
            ⚡ Action Required — {stageLabel(cr).label}
          </div>
          {canCompleteImpl&&(
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
              <div>
                <label style={LBL}>Implementation Notes</label>
                <textarea value={implNotes} onChange={e=>setImplNotes(e.target.value)} placeholder="Document what was done…" style={{...inp(),minHeight:60,resize:"vertical"}}/>
              </div>
              <div>
                <label style={LBL}>Outcome</label>
                <div style={{display:"flex",gap:8}}>
                  {["successful","failed"].map(o=>(
                    <button key={o} onClick={()=>setOutcome(o)} style={{flex:1,padding:"8px",border:`1.5px solid ${outcome===o?(o==="successful"?C.green:C.red):C.border}`,borderRadius:6,background:outcome===o?(o==="successful"?C.greenBg:C.redBg):"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:outcome===o?(o==="successful"?C.green:C.red):C.muted,textTransform:"capitalize"}}>
                      {o==="successful"?"✅ Successful":"❌ Failed"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div>
            <label style={LBL}>Note (optional)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note for your decision…" style={{...inp(),minHeight:48,resize:"vertical"}}/>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Close</button>
        {(canMgrApprove||canL1Approve||canL2Approve)&&(
          <button onClick={()=>doAction("reject")} disabled={saving} style={btn("danger")}>Reject</button>
        )}
        {canMgrApprove&&<button onClick={()=>doAction("approve_manager")} disabled={saving} style={btn("primary")}>✓ Approve & Forward →</button>}
        {canL1Approve&&<button onClick={()=>doAction("approve_level")} disabled={saving} style={btn("primary")}>✓ Approve Level 1 →</button>}
        {canL2Approve&&<button onClick={()=>doAction("approve_level")} disabled={saving} style={btn("primary")}>✓ Approve Level 2 →</button>}
        {canStartImpl&&<button onClick={()=>doAction("start_implementation")} disabled={saving} style={{...btn("primary"),background:C.blue}}>🔧 Start Implementation</button>}
        {canCompleteImpl&&<button onClick={()=>doAction("complete_implementation")} disabled={saving} style={{...btn("primary"),background:outcome==="failed"?C.red:C.green}}>{outcome==="failed"?"❌ Mark Failed":"✅ Mark Complete"}</button>}
        {canClose&&<button onClick={()=>doAction("close")} disabled={saving} style={{...btn("primary"),background:C.muted}}>🔒 Close CR</button>}
      </div>
    </Modal>
  );
}

