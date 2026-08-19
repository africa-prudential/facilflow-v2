import React, { useState } from "react";
import { Zap, Monitor, XCircle, Check, CheckCircle2, Wrench, Paperclip, ExternalLink, Lock } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { CR_STATUS, DOC_LABELS } from "../../constants.js";
import { fmtDT, fmtD, humanize } from "../../utils.js";
import RichTextView from "../../components/RichTextView.jsx";
import { Av, CRChip, EnvTag, RiskTag, Modal } from "../../components/ui.jsx";

export default function CRDetail({cr,onClose,ctx,onAction}){
  const {me,uid,users,crUsers,approvalLevels} = ctx;
  const [tab,       setTab]     = useState("details");
  const [note,      setNote]    = useState("");
  const [implNotes, setImplNotes]= useState(cr.implementation_notes||"");
  const [outcome,   setOutcome] = useState(cr.implementation_outcome||"successful");
  const [comment,   setComment] = useState("");
  const [saving,    setSaving]  = useState(false);
  const [rejectError, setRejectError] = useState("");

  const myRoles   = ctx.myChangeRoles||[];
  // Change manager can approve any pending_manager CR — not just ones they were assigned to at creation
  const isMgr     = myRoles.includes("change_manager");
  const isImpl    = myRoles.includes("change_implementer");
  const isRevwr   = myRoles.includes("change_reviewer") && (cr.reviewer_ids||[]).includes(uid);
  const isTech    = cr.initiator===uid;
  const isDeptLineManager = me.role==="line_manager" && me.dept===users[cr.initiator]?.dept;

  // Current pending level, if any — driven by however many approval levels are configured
  const currentLevel   = (cr.level_approvals||[]).find(l => cr.current_stage === `pending_level_${l.level}`);
  const canLevelApprove= !!currentLevel && myRoles.includes(currentLevel.role_key);

  const canLineManagerApprove = isDeptLineManager && cr.status==="pending_line_manager";
  const canMgrApprove  = isMgr  && cr.status==="pending_manager";
  const canStartImpl   = isImpl && cr.status==="pending_implementation";
  const canCompleteImpl= isImpl && cr.status==="in_progress";
  const canClose       = (isMgr||isImpl) && cr.status==="completed";
  const canReview      = isRevwr && !["rejected","completed","closed","failed"].includes(cr.status);

  const mgr   = users[cr.change_manager_id];
  const tech  = users[cr.initiator];

  const doAction = async (action, extra={}) => {
    const actionNote = action === "reviewer_comment" ? comment : note;
    if(action === "reject" && !actionNote.trim()){
      setRejectError("A reason is required to reject this change request.");
      return;
    }
    setRejectError("");
    setSaving(true);
    try { await onAction(cr.id, action, actionNote, extra); onClose(); }
    catch(e){ setSaving(false); }
  };

  // ── STAGE TRACKER ──────────────────────────────────────
  const levels = cr.level_approvals||[];
  const stages = [
    {key:"submitted",       label:"Submitted",       done: true,                                                    at:cr.created_at},
    {key:"pending_line_manager", label:"Line Manager", done: cr.status!=="pending_line_manager"&&cr.status!=="rejected", active: cr.status==="pending_line_manager", at:cr.history?.find(h=>h.s==="pending_manager")?.at},
    {key:"pending_manager", label:"Change Manager",  done: cr.status!=="pending_manager"&&cr.status!=="pending_line_manager"&&cr.status!=="rejected",  at:cr.history?.find(h=>h.s==="pending_approval")?.at, who:mgr?.name},
    ...(levels.map(l=>({
      key:`level_${l.level}`,
      label: l.name,
      done: l.status==="approved",
      active: cr.current_stage===`pending_level_${l.level}`,
      at: l.approved_at,
      who: users[l.approver_id]?.name,
    }))),
    {key:"implementation",  label:"Implementation",  done: ["completed","closed"].includes(cr.status), active: cr.status==="pending_implementation"||cr.status==="in_progress", at:cr.implementation_completed_at},
    {key:"closed",          label:"Closed",          done: cr.status==="closed",                                    at:cr.history?.find(h=>h.s==="closed")?.at},
  ];
  const isRejected = cr.status==="rejected";

  return (
    <Modal title={`${cr.id}${cr.version>1?` v${cr.version}`:""}`} sub={cr.title} onClose={onClose} w={860}>
      {/* Header badges */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,padding:"10px 12px",background:C.pageBg,borderRadius:8}}>
        {cr.is_emergency&&<span style={{fontSize:11,fontWeight:700,color:C.red,background:"#fff",padding:"2px 8px",borderRadius:4,border:`1px solid ${C.red}30`,display:"inline-flex",alignItems:"center",gap:4}}><Zap size={12}/> EMERGENCY</span>}
        <CRChip s={cr.status}/>
        <EnvTag e={cr.environment}/>
        <RiskTag r={cr.risk_level||cr.riskLevel}/>
        <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"#fff",border:`1px solid ${C.border}`,color:C.muted,fontWeight:600}}>{cr.change_type||cr.changeType}</span>
        {cr.system_name&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"#fff",border:`1px solid ${C.border}`,color:C.muted,display:"inline-flex",alignItems:"center",gap:4}}><Monitor size={12}/> {cr.system_name}</span>}
      </div>

      {/* ── STAGE TRACKER ── */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:14}}>Change Progress</div>
        {isRejected?(
          <div style={{padding:"10px 14px",background:C.redBg,borderRadius:8,fontSize:13,color:C.red,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
            <XCircle size={16}/> This change request was rejected. A new CR must be raised to proceed.
          </div>
        ):(
          <div style={{display:"flex",alignItems:"flex-start",overflowX:"auto",paddingBottom:4}}>
            {stages.map((s,i)=>{
              const isActive = s.active || (i===0 && cr.status==="pending_manager" && !s.done);
              const color = s.done?C.green:isActive?C.brand:C.muted;
              return (
                <React.Fragment key={s.key}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:90,flexShrink:0}}>
                    <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                      background:s.done?C.green:isActive?C.brand:C.border,
                      color:s.done||isActive?"#fff":C.muted,
                      fontSize:14,fontWeight:700,
                      boxShadow:isActive?`0 0 0 3px ${C.brand}30`:s.done?`0 0 0 3px ${C.green}20`:"none"}}>
                      {s.done?<Check size={16}/>:isActive?"●":"○"}
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color,textAlign:"center",lineHeight:1.3}}>{s.label}</div>
                    {s.who&&<div style={{fontSize:9,color:C.muted,textAlign:"center"}}>{s.who}</div>}
                    {s.at&&s.done&&<div style={{fontSize:9,color:C.muted}}>{fmtD(s.at)}</div>}
                    {isActive&&<div style={{fontSize:9,color:C.brand,fontWeight:600}}>← Current</div>}
                  </div>
                  {i<stages.length-1&&(
                    <div style={{flex:1,height:2,background:s.done?C.green:C.border,marginTop:15,minWidth:20,flexShrink:1}}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:16}}>
        {["details","approvals","history","comments"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 15px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===t?700:500,background:"transparent",color:tab===t?C.brand:C.muted,borderBottom:tab===t?`2px solid ${C.brand}`:"2px solid transparent",marginBottom:-1,textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>

      {/* Details tab */}
      {tab==="details"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["Change Type",cr.change_type||cr.changeType],["Risk Level",cr.risk_level||cr.riskLevel],["Environment",cr.environment],["Category",cr.category],["System",cr.system_name||cr.systemName],["Deploy Date",cr.deploy_date||cr.deployDate],["Deploy Window",`${cr.deploy_start||cr.deployStart||""} – ${cr.deploy_end||cr.deployEnd||""}`],["Raised By",tech?.name||"—"],["Change Manager",mgr?.name||"Not assigned"]].map(([k,v])=>v?(
              <div key={k} style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>{k}</div>
                <div style={{fontSize:13,color:C.ink,fontWeight:500}}>{String(v)}</div>
              </div>
            ):null)}
          </div>
          {cr.description&&<div style={{background:C.pageBg,borderRadius:7,padding:"12px 14px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Description</div><RichTextView value={cr.description} style={{lineHeight:1.7}}/></div>}
          {cr.rollback&&<div style={{background:C.pageBg,borderRadius:7,padding:"12px 14px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Rollback Plan</div><RichTextView value={cr.rollback} style={{lineHeight:1.7}}/></div>}
          {cr.test_evidence&&<div style={{background:C.pageBg,borderRadius:7,padding:"12px 14px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Testing Evidence</div><div style={{fontSize:13,color:C.ink,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{cr.test_evidence}</div></div>}
          {cr.attachments?.length>0&&<div style={{background:C.pageBg,borderRadius:7,padding:"12px 14px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Supporting Documents</div>
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
          {/* Implementation feedback if completed */}
          {cr.implementation_notes&&<div style={{background:C.greenBg,border:`1px solid ${C.green}30`,borderRadius:7,padding:"12px 14px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Implementation Notes</div>
            <div style={{fontSize:13,color:C.ink,lineHeight:1.7}}>{cr.implementation_notes}</div>
            {cr.implementation_outcome&&<div style={{marginTop:8,fontSize:12,fontWeight:700,color:cr.implementation_outcome==="failed"?C.red:C.green}}>Outcome: {cr.implementation_outcome}</div>}
          </div>}
        </div>
      )}

      {/* Approvals tab */}
      {tab==="approvals"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{background:C.pageBg,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:700,color:C.ink,marginBottom:10}}>Change Manager</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Av i={mgr?.initials||"?"} s={32}/>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{mgr?.name||"Not assigned"}</div>
                <div style={{fontSize:11,color:C.muted}}>{mgr?.email}</div>
              </div>
              <div style={{marginLeft:"auto"}}>
                {cr.status==="pending_line_manager"
                  ?<span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:"#F8FAFC",color:C.muted}}>Awaiting</span>
                  :cr.status==="pending_manager"
                    ?<span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:C.amberBg,color:C.amber}}>Pending</span>
                    :cr.status==="rejected"
                      ?<span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:C.redBg,color:C.red}}>Rejected</span>
                      :<span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:C.greenBg,color:C.green,display:"inline-flex",alignItems:"center",gap:4}}>Approved <Check size={12}/></span>}
              </div>
            </div>
          </div>
          {levels.map((l,i)=>(
            <div key={i} style={{background:C.pageBg,borderRadius:8,padding:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C.ink,marginBottom:10}}>{l.name}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,color:C.muted}}>{l.role_key?.replace(/_/g," ")}</div>
                <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,
                  display:"inline-flex",alignItems:"center",gap:4,
                  background:l.status==="approved"?C.greenBg:cr.current_stage===`pending_level_${l.level}`?C.amberBg:"#F8FAFC",
                  color:l.status==="approved"?C.green:cr.current_stage===`pending_level_${l.level}`?C.amber:C.muted}}>
                  {l.status==="approved"?<>Approved <Check size={12}/> — {fmtD(l.approved_at)}</>:cr.current_stage===`pending_level_${l.level}`?"Pending":"Awaiting"}
                </span>
              </div>
              {l.note&&<div style={{fontSize:12,color:C.muted,marginTop:8,fontStyle:"italic"}}>"{l.note}"</div>}
            </div>
          ))}
        </div>
      )}

      {/* History tab */}
      {tab==="history"&&(
        <div style={{position:"relative",paddingLeft:20}}>
          <div style={{position:"absolute",left:7,top:6,bottom:6,width:2,background:C.border}}/>
          {(cr.history||[]).map((h,i)=>{
            const m=CR_STATUS[h.s]||{color:C.muted};
            return (
              <div key={i} style={{position:"relative",marginBottom:14}}>
                <div style={{position:"absolute",left:-17,width:10,height:10,borderRadius:"50%",background:m.color||C.brand,border:"2px solid #fff",top:2}}/>
                <div style={{fontSize:11,fontWeight:600,color:m.color||C.ink}}>{humanize(h.label||h.s)}</div>
                <div style={{fontSize:10,color:C.muted}}>{fmtDT(h.at)} · {users[h.by]?.name||"System"}</div>
                {h.note&&<div style={{fontSize:11,color:C.ink2,marginTop:2,fontStyle:"italic"}}>"{h.note}"</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Comments tab (reviewers) */}
      {tab==="comments"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(cr.reviewer_comments||[]).length===0&&<div style={{color:C.muted,fontSize:13,padding:"20px 0",textAlign:"center"}}>No reviewer comments yet.</div>}
          {(cr.reviewer_comments||[]).map((c,i)=>(
            <div key={i} style={{background:C.pageBg,borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:700,color:C.ink}}>{users[c.by]?.name||"Reviewer"}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {c.concur!==undefined&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:c.concur?C.greenBg:C.amberBg,color:c.concur?C.green:C.amber}}>{c.concur?"Concurred":"Noted"}</span>}
                  <span style={{fontSize:10,color:C.muted}}>{fmtDT(c.at)}</span>
                </div>
              </div>
              <div style={{fontSize:13,color:C.ink,lineHeight:1.6}}>{c.comment}</div>
            </div>
          ))}
          {/* Reviewer can add comment */}
          {canReview&&(
            <div style={{marginTop:8,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
              <label style={LBL}>Add Review Comment</label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Your review comments or concurrence…" style={{...inp(),minHeight:70,resize:"vertical"}}/>
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button onClick={()=>doAction("reviewer_comment",{concur:false})} style={btn("ghost")}>Note Only</button>
                <button onClick={()=>doAction("reviewer_comment",{concur:true})} style={{...btn("primary"),background:C.green}}><Check size={14}/> Concur</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action note field */}
      {(canLineManagerApprove||canMgrApprove||canLevelApprove||canStartImpl||canCompleteImpl)&&tab!=="comments"&&(
        <div style={{marginTop:14}}>
          <label style={LBL}>Note {(canLineManagerApprove||canMgrApprove||canLevelApprove)?"— required if rejecting":"(optional)"}{rejectError&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {rejectError}</span>}</label>
          <textarea value={note} onChange={e=>{setNote(e.target.value);if(rejectError)setRejectError("");}} placeholder="Add a note for your decision…" style={{...inp(!!rejectError),minHeight:52,resize:"vertical"}}/>
        </div>
      )}

      {/* Implementation feedback */}
      {canCompleteImpl&&(
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:10}}>
          <div>
            <label style={LBL}>Implementation Notes</label>
            <textarea value={implNotes} onChange={e=>setImplNotes(e.target.value)} placeholder="Document what was done, any issues encountered…" style={{...inp(),minHeight:80,resize:"vertical"}}/>
          </div>
          <div>
            <label style={LBL}>Outcome</label>
            <div style={{display:"flex",gap:10}}>
              {["successful","failed"].map(o=>(
                <button key={o} onClick={()=>setOutcome(o)} style={{flex:1,padding:"10px",border:`1.5px solid ${outcome===o?(o==="successful"?C.green:C.red):C.border}`,borderRadius:8,background:outcome===o?(o==="successful"?C.greenBg:C.redBg):"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:outcome===o?(o==="successful"?C.green:C.red):C.muted,textTransform:"capitalize",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {o==="successful"?<><CheckCircle2 size={14}/> Successful</>:<><XCircle size={14}/> Failed</>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Close</button>
        {canLineManagerApprove&&<>
          <button onClick={()=>doAction("reject")} disabled={saving} style={btn("danger")}>Reject</button>
          <button onClick={()=>doAction("approve_line_manager")} disabled={saving} style={btn("primary")}><Check size={14}/> Approve & Forward →</button>
        </>}
        {canMgrApprove&&<>
          <button onClick={()=>doAction("reject")} disabled={saving} style={btn("danger")}>Reject</button>
          <button onClick={()=>doAction("approve_manager")} disabled={saving} style={btn("primary")}><Check size={14}/> Approve & Forward →</button>
        </>}
        {canLevelApprove&&<>
          <button onClick={()=>doAction("reject")} disabled={saving} style={btn("danger")}>Reject</button>
          <button onClick={()=>doAction("approve_level")} disabled={saving} style={btn("primary")}><Check size={14}/> Approve {currentLevel.name} →</button>
        </>}
        {canStartImpl&&<button onClick={()=>doAction("start_implementation")} disabled={saving} style={{...btn("primary"),background:C.blue}}><Wrench size={14}/> Start Implementation</button>}
        {canCompleteImpl&&<button onClick={()=>doAction("complete_implementation",{implementationNotes:implNotes,outcome})} disabled={saving} style={{...btn("primary"),background:outcome==="failed"?C.red:C.green}}>
          {outcome==="failed"?<><XCircle size={14}/> Mark Failed</>:<><CheckCircle2 size={14}/> Mark Complete</>}
        </button>}
        {canClose&&<button onClick={()=>doAction("close")} disabled={saving} style={{...btn("primary"),background:C.muted}}><Lock size={14}/> Close CR</button>}
      </div>
    </Modal>
  );
}

