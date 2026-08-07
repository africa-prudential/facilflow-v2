import { useState } from "react";
import { Zap, Check, CheckCircle2, XCircle, Wrench, Lock, Paperclip, ExternalLink, ShieldAlert } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { fmtDT, fmtD, now, isSuperAdmin } from "../../utils.js";
import { CRChip, EnvTag, RiskTag, Modal } from "../../components/ui.jsx";
import { updateCR } from "../../lib/supabase.js";

const DOC_LABELS = {
  uat_signoff:      "UAT Sign-off Form",
  test_scripts:     "Test Scripts",
  user_concurrence: "User Concurrence",
  other:            "Other Supporting Documents",
};

export default function AdminCRDetailModal({cr, onClose, ctx, uniqueUsers, stageLabel}){
  const {uid, crs, setCrs, flash, userCRoles, approvalLevels, adminUser, addAudit, tenantConfig} = ctx;
  const [tab,       setTab]     = useState("details");
  const [note,      setNote]    = useState("");
  const [implNotes, setImplNotes]= useState(cr.implementation_notes||"");
  const [outcome,   setOutcome] = useState(cr.implementation_outcome||"successful");
  const [saving,    setSaving]  = useState(false);
  const [rejectError, setRejectError] = useState("");
  const [confirmOverride, setConfirmOverride] = useState(null);

  const raiser = uniqueUsers.find(u=>u.id===cr.initiator);
  const levels = cr.level_approvals||[];

  // Check what roles the logged-in admin actually holds in change management
  const myChangRoles = (userCRoles||[]).filter(r=>r.user_id===uid).map(r=>r.role_key);
  const isMgr     = myChangRoles.includes("change_manager");
  const isImpl    = myChangRoles.includes("change_implementer");
  const currentLevel = levels.find(l=>cr.current_stage===`pending_level_${l.level}`);
  const canLevelApprove = !!currentLevel && myChangRoles.includes(currentLevel.role_key);

  const isDeptLineManager = adminUser?.role==="line_manager" && adminUser?.dept===raiser?.dept;

  // What can THIS admin actually do right now, based on real role assignment
  const canLineManagerApprove = isDeptLineManager && cr.status==="pending_line_manager";
  const canMgrApprove   = isMgr  && cr.status==="pending_manager";
  const canStartImpl    = isImpl && cr.status==="pending_implementation";
  const canCompleteImpl = isImpl && cr.status==="in_progress";
  const canClose        = (isMgr||isImpl) && cr.status==="completed";
  const hasNormalAction = canLineManagerApprove||canMgrApprove||canLevelApprove||canStartImpl||canCompleteImpl||canClose;

  // Super-admin override: only offered when the stage genuinely needs action
  // and this admin does NOT hold the role for it — a distinct, audited path,
  // not a silent bypass of the normal approval chain. It only becomes usable
  // once the stage's own SLA has been breached AND lingered an extra hour —
  // an override is for a genuinely stuck process, not a shortcut.
  const stagePendingAction = ["pending_line_manager","pending_manager","pending_approval","pending_implementation","in_progress","completed"].includes(cr.status);
  const stageSlaHours =
    cr.status==="pending_manager" ? tenantConfig?.manager_sla_hours :
    currentLevel ? (approvalLevels||[]).find(l=>l.level_order===currentLevel.level)?.sla_hours :
    (cr.status==="pending_implementation"||cr.status==="in_progress") ? tenantConfig?.implementation_sla_hours :
    null;
  const stageAgeHours = (Date.now() - new Date(cr.stage_entered_at||cr.created_at).getTime()) / 3600000;
  const overrideUnlocksAtHours = (stageSlaHours ?? 0) + 1;
  const overrideReady = stageAgeHours >= overrideUnlocksAtHours;
  const overrideRemainingHours = Math.max(0, overrideUnlocksAtHours - stageAgeHours);
  const canOverride = isSuperAdmin(adminUser) && stagePendingAction && !hasNormalAction;
  const overrideAction =
    cr.status==="pending_line_manager"   ? {action:"approve_line_manager",     label:"Approve & Forward →"} :
    cr.status==="pending_manager"        ? {action:"approve_manager",         label:"Approve & Forward →"} :
    currentLevel                          ? {action:"approve_level",           label:`Approve ${currentLevel.name||"Level"} →`} :
    cr.status==="pending_implementation" ? {action:"start_implementation",    label:"Start Implementation"} :
    cr.status==="in_progress"            ? {action:"complete_implementation", label: outcome==="failed"?"Mark Failed":"Mark Complete"} :
    cr.status==="completed"              ? {action:"close",                  label:"Close CR"} : null;

  const hasAction = hasNormalAction || canOverride;

  const doAction = async (action, isOverride=false) => {
    if(isOverride && !overrideReady){
      flash(`Override not available yet — unlocks in ${Math.ceil(overrideRemainingHours*60)} minute(s) after SLA breach.`, "error");
      return;
    }
    if(action === "reject" && !note.trim()){
      setRejectError("A reason is required to reject this change request.");
      return;
    }
    setRejectError("");
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
      else if(action==="approve_line_manager"){
        nextStatus="pending_manager"; nextStage="pending_manager";
        newHistory.push({s:"pending_manager",at:iso,by:uid,label:"Approved by Line Manager",note});
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

      if(isOverride && newHistory.length){
        const last = newHistory.length-1;
        newHistory[last] = {...newHistory[last], label:`[Admin Override] ${newHistory[last].label}`};
      }

      const saved = await updateCR(cr.id,{
        ...extra, status:nextStatus, current_stage:nextStage,
        current_level:nextLevel, history:newHistory,
        updated_at:new Date().toISOString(),
      });
      setCrs(p=>p.map(c=>c.id===cr.id?saved:c));
      flash(`CR ${nextStatus.replace(/_/g," ")}`);
      if(isOverride) addAudit?.("CR_ADMIN_OVERRIDE", cr.id, `Admin override: ${action} on ${cr.id} (${cr.status} → ${nextStatus})`);
      onClose();
    } catch(e){ flash(e.message,"error"); }
    finally { setSaving(false); }
  };

  // Stage tracker
  const stages = [
    {label:"Submitted",  done:true,                                      at:cr.created_at},
    {label:"Line Manager", done:cr.status!=="pending_line_manager"&&cr.status!=="rejected", active:cr.status==="pending_line_manager"},
    {label:"Mgr Review", done:cr.status!=="pending_manager"&&cr.status!=="pending_line_manager"&&cr.status!=="rejected", active:cr.status==="pending_manager"},
    ...(levels.map(l=>({label:l.name, done:l.status==="approved", active:cr.current_stage===`pending_level_${l.level}`, at:l.approved_at}))),
    {label:"Implementation", done:["completed","closed"].includes(cr.status), active:cr.status==="pending_implementation"||cr.status==="in_progress"},
    {label:"Closed",     done:cr.status==="closed"},
  ];

  return (
    <>
    <Modal title={`${cr.id}${cr.version>1?` v${cr.version}`:""}`} sub={cr.title} onClose={onClose} w={820}>

      {/* Header badges */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,padding:"10px 12px",background:C.pageBg,borderRadius:8}}>
        <CRChip s={cr.status}/>
        <EnvTag e={cr.environment}/>
        <RiskTag r={cr.risk_level||cr.riskLevel}/>
        <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:4,background:C.surface,color:C.ink2}}>{cr.change_type||cr.changeType}</span>
        {(cr.is_emergency||cr.isEmergency)&&<span style={{fontSize:11,fontWeight:700,color:C.red,background:C.redBg,padding:"2px 8px",borderRadius:4,display:"inline-flex",alignItems:"center",gap:4}}><Zap size={11}/> Emergency</span>}
        {hasAction&&<span style={{fontSize:11,fontWeight:700,color:C.brand,background:C.brandLt,padding:"2px 8px",borderRadius:4,marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:4}}><Zap size={11}/> Action Required</span>}
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
                    {s.done?<Check size={13}/>:s.active?"●":"○"}
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
          {cr.attachments?.length>0&&<div style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Supporting Documents</div>
            {Object.entries(cr.attachments.reduce((g,f)=>{(g[f.docType||"other"]=g[f.docType||"other"]||[]).push(f);return g;},{})).map(([docType,files])=>(
              <div key={docType} style={{marginBottom:6}}>
                <div style={{fontSize:11,fontWeight:600,color:C.ink2,marginBottom:3}}>{DOC_LABELS[docType]||docType}</div>
                {files.map((f,i)=>(
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.blue,padding:"2px 0",textDecoration:"none"}}>
                    <Paperclip size={12}/>{f.name}<ExternalLink size={11}/>
                  </a>
                ))}
              </div>
            ))}
          </div>}
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
                color:cr.status==="pending_manager"?C.amber:cr.status==="rejected"?C.red:C.green,display:"inline-flex",alignItems:"center",gap:4}}>
                {cr.status==="pending_manager"?"Pending":cr.status==="rejected"?"Rejected":<>Approved <Check size={11}/></>}
              </span>
            </div>
          </div>
          {levels.map((l,i)=>(
            <div key={i} style={{background:C.pageBg,borderRadius:8,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:11,fontWeight:700,color:C.ink}}>{l.name}</div>
                <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
                  background:l.status==="approved"?C.greenBg:cr.current_stage===`pending_level_${l.level}`?C.amberBg:"#F8FAFC",
                  color:l.status==="approved"?C.green:cr.current_stage===`pending_level_${l.level}`?C.amber:C.muted,display:"inline-flex",alignItems:"center",gap:4}}>
                  {l.status==="approved"?<>Approved <Check size={11}/> — {fmtD(l.approved_at)}</>:cr.current_stage===`pending_level_${l.level}`?"Pending":"Awaiting"}
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
          <div style={{fontSize:12,fontWeight:700,color:C.brand,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <Zap size={13}/> Action Required — {stageLabel(cr).label}
          </div>
          {(canCompleteImpl||(canOverride&&overrideAction?.action==="complete_implementation"))&&(
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
              <div>
                <label style={LBL}>Implementation Notes</label>
                <textarea value={implNotes} onChange={e=>setImplNotes(e.target.value)} placeholder="Document what was done…" style={{...inp(),minHeight:60,resize:"vertical"}}/>
              </div>
              <div>
                <label style={LBL}>Outcome</label>
                <div style={{display:"flex",gap:8}}>
                  {["successful","failed"].map(o=>(
                    <button key={o} onClick={()=>setOutcome(o)} style={{flex:1,padding:"8px",border:`1.5px solid ${outcome===o?(o==="successful"?C.green:C.red):C.border}`,borderRadius:6,background:outcome===o?(o==="successful"?C.greenBg:C.redBg):"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:outcome===o?(o==="successful"?C.green:C.red):C.muted,textTransform:"capitalize",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      {o==="successful"?<><CheckCircle2 size={13}/> Successful</>:<><XCircle size={13}/> Failed</>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div>
            <label style={LBL}>Note {(canLineManagerApprove||canMgrApprove||canLevelApprove||canOverride)?"— required if rejecting":"(optional)"}{rejectError&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {rejectError}</span>}</label>
            <textarea value={note} onChange={e=>{setNote(e.target.value);if(rejectError)setRejectError("");}} placeholder="Add a note for your decision…" style={{...inp(!!rejectError),minHeight:48,resize:"vertical"}}/>
          </div>
          {canOverride&&(
            <div style={{marginTop:10,padding:"9px 12px",borderRadius:7,background:C.amberBg,border:`1px solid ${C.amber}40`,fontSize:11,color:C.amber,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
              <ShieldAlert size={13}/> {overrideReady
                ? "You don't hold the role for this stage. This stage's SLA has been breached for over an hour — Admin Override is now available and will be recorded in the audit log."
                : `You don't hold the role for this stage. Admin Override unlocks ${Math.ceil(overrideRemainingHours*60)} minute(s) from now, once the SLA has been breached for an hour.`}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Close</button>
        {(canLineManagerApprove||canMgrApprove||canLevelApprove||canOverride)&&(
          <button onClick={()=>canOverride?setConfirmOverride({action:"reject",label:"Reject"}):doAction("reject")} disabled={saving} style={btn("danger")}>Reject</button>
        )}
        {canLineManagerApprove&&<button onClick={()=>doAction("approve_line_manager")} disabled={saving} style={btn("primary")}><Check size={14}/> Approve & Forward →</button>}
        {canMgrApprove&&<button onClick={()=>doAction("approve_manager")} disabled={saving} style={btn("primary")}><Check size={14}/> Approve & Forward →</button>}
        {canLevelApprove&&<button onClick={()=>doAction("approve_level")} disabled={saving} style={btn("primary")}><Check size={14}/> Approve {currentLevel?.name||"Level"} →</button>}
        {canOverride&&overrideAction&&(
          <button onClick={()=>setConfirmOverride(overrideAction)} disabled={saving||!overrideReady}
            title={overrideReady?undefined:`Unlocks in ${Math.ceil(overrideRemainingHours*60)} minute(s)`}
            style={{...btn("primary"),background:overrideReady?C.amber:C.border,color:overrideReady?"#fff":C.muted,cursor:overrideReady?"pointer":"not-allowed"}}>
            <ShieldAlert size={14}/> {overrideAction.label} (Override)
          </button>
        )}
        {canStartImpl&&<button onClick={()=>doAction("start_implementation")} disabled={saving} style={{...btn("primary"),background:C.blue}}><Wrench size={14}/> Start Implementation</button>}
        {canCompleteImpl&&<button onClick={()=>doAction("complete_implementation")} disabled={saving} style={{...btn("primary"),background:outcome==="failed"?C.red:C.green}}>{outcome==="failed"?<><XCircle size={14}/> Mark Failed</>:<><CheckCircle2 size={14}/> Mark Complete</>}</button>}
        {canClose&&<button onClick={()=>doAction("close")} disabled={saving} style={{...btn("primary"),background:C.muted}}><Lock size={14}/> Close CR</button>}
      </div>
    </Modal>

    {confirmOverride&&(
      <Modal title="Confirm Admin Override" onClose={()=>setConfirmOverride(null)} w={440}>
        <div style={{marginBottom:20,fontSize:13,color:C.ink2,lineHeight:1.6}}>
          You're about to <strong style={{color:C.amber}}>{confirmOverride.label.replace(" →","").replace(" (Override)","")}</strong> on <strong>{cr.id}</strong> without holding the role assigned to this stage. This will be recorded in the audit log as an Admin Override, distinct from a normal approval. Are you sure?
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={()=>setConfirmOverride(null)} style={btn("ghost")}>Cancel</button>
          <button onClick={()=>{doAction(confirmOverride.action,true);setConfirmOverride(null);}} style={{...btn("primary"),background:C.amber}}><ShieldAlert size={14}/> Confirm Override</button>
        </div>
      </Modal>
    )}
    </>
  );
}

