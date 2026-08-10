import React, { useState, useEffect } from "react";
import { C, btn, inp, card, LBL } from "../theme.js";
import { Av, Modal, PageTitle } from "../components/ui.jsx";
import AddRoleControl from "../components/AddRoleControl.jsx";
import { saveApprovalLevel, deleteApprovalLevel, saveTenantConfig } from "../lib/supabase.js";

export default function CRPolicy({ctx}){ return <CRPolicyFull ctx={ctx}/>; }

// ══════════════════════════════════════════════════════════════
// CR POLICY — Rebuilt with real approval levels
// ══════════════════════════════════════════════════════════════
function CRPolicyFull({ctx}){
  const {approvalLevels,setApprovalLevels,tenantConfig,setTenantConfig,users,flash,tid,changeRoles,setChangeRoles,userCRoles}=ctx;
  const changeManagerIds = new Set((userCRoles||[]).filter(r=>r.role_key==="change_manager").map(r=>r.user_id));
  const changeManagerUsers = users.filter(u=>changeManagerIds.has(u.id));
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);
  const [escForm,setEscForm]=useState(()=>({
    escalation_authority_id: tenantConfig?.escalation_authority_id||tenantConfig?.change_manager_id||"",
    escalation_cc_email:     tenantConfig?.escalation_cc_email||"",
    manager_sla_hours:              tenantConfig?.manager_sla_hours??"",
    manager_reminder_before_minutes:  tenantConfig?.manager_reminder_before_minutes??"",
    line_manager_sla_hours:              tenantConfig?.line_manager_sla_hours??"",
    line_manager_reminder_before_minutes: tenantConfig?.line_manager_reminder_before_minutes??"",
    implementation_sla_hours:             tenantConfig?.implementation_sla_hours??"",
    implementation_reminder_before_minutes: tenantConfig?.implementation_reminder_before_minutes??"",
  }));
  const [savingEsc,setSavingEsc]=useState(false);
  const [sameAsManager,setSameAsManager]=useState(()=>!tenantConfig?.escalation_authority_id);

  useEffect(()=>{
    setEscForm({
      escalation_authority_id: tenantConfig?.escalation_authority_id||tenantConfig?.change_manager_id||"",
      escalation_cc_email:     tenantConfig?.escalation_cc_email||"",
      manager_sla_hours:              tenantConfig?.manager_sla_hours??"",
      manager_reminder_before_minutes:  tenantConfig?.manager_reminder_before_minutes??"",
      line_manager_sla_hours:              tenantConfig?.line_manager_sla_hours??"",
      line_manager_reminder_before_minutes: tenantConfig?.line_manager_reminder_before_minutes??"",
      implementation_sla_hours:             tenantConfig?.implementation_sla_hours??"",
      implementation_reminder_before_minutes: tenantConfig?.implementation_reminder_before_minutes??"",
    });
    setSameAsManager(!tenantConfig?.escalation_authority_id);
  },[tenantConfig]);

  const CHANGE_TYPES = ["Standard","Normal","Emergency"];

  const addLevel = () => {
    const next = (approvalLevels||[]).length + 1;
    setEditing({
      id: crypto.randomUUID(), tenant_id: tid,
      level_order: next, name:`Level ${next} Approval`,
      description:"", role_key:"change_approver_l1",
      change_types:["Normal"],
    });
  };

  const saveLevel = async (level) => {
    setSaving(true);
    try {
      const saved = await saveApprovalLevel({...level, tenant_id:tid});
      setApprovalLevels(p => {
        const exists = p.find(l=>l.id===saved.id);
        return exists ? p.map(l=>l.id===saved.id?saved:l) : [...p, saved];
      });
      flash("Approval level saved");
      setEditing(null);
    } catch(e){ flash(e.message,"error"); }
    finally { setSaving(false); }
  };

  const removeLevel = async (id) => {
    try {
      await deleteApprovalLevel(id);
      setApprovalLevels(p=>p.filter(l=>l.id!==id));
      flash("Level removed");
    } catch(e){ flash(e.message,"error"); }
  };

  const saveManager = async (managerId) => {
    try {
      const saved = await saveTenantConfig(tid, {change_manager_id: managerId||null});
      setTenantConfig(p=>({...p,...saved}));
      flash("Change Manager updated");
    } catch(e){ flash(e.message,"error"); }
  };

  const saveEscalation = async () => {
    const escalationId = sameAsManager ? (tenantConfig?.change_manager_id||"") : escForm.escalation_authority_id;
    if (!escalationId) { flash(sameAsManager?"Configure a Change Manager first":"Escalation Authority is required","error"); return; }
    if (escForm.manager_sla_hours==="")               { flash("Change Manager SLA is required","error"); return; }
    if (escForm.manager_reminder_before_minutes==="")  { flash("Change Manager SLA Reminder is required","error"); return; }
    if (escForm.implementation_sla_hours==="")         { flash("Implementation SLA is required","error"); return; }
    if (escForm.implementation_reminder_before_minutes==="") { flash("Implementation Reminder is required","error"); return; }
    setSavingEsc(true);
    try {
      const saved = await saveTenantConfig(tid, {
        escalation_authority_id: sameAsManager ? null : (escalationId||null),
        escalation_cc_email:     escForm.escalation_cc_email||null,
        manager_sla_hours:             escForm.manager_sla_hours===""?null:+escForm.manager_sla_hours,
        manager_reminder_before_minutes: escForm.manager_reminder_before_minutes===""?null:+escForm.manager_reminder_before_minutes,
        line_manager_sla_hours:             escForm.line_manager_sla_hours===""?null:+escForm.line_manager_sla_hours,
        line_manager_reminder_before_minutes: escForm.line_manager_reminder_before_minutes===""?null:+escForm.line_manager_reminder_before_minutes,
        implementation_sla_hours:             escForm.implementation_sla_hours===""?null:+escForm.implementation_sla_hours,
        implementation_reminder_before_minutes: escForm.implementation_reminder_before_minutes===""?null:+escForm.implementation_reminder_before_minutes,
      });
      setTenantConfig(p=>({...p,...saved}));
      flash("Escalation & SLA settings saved");
    } catch(e){ flash(e.message,"error"); }
    finally { setSavingEsc(false); }
  };

  const cmUser = users.find(u=>u.id===tenantConfig?.change_manager_id);
  const escUser = users.find(u=>u.id===(tenantConfig?.escalation_authority_id||tenantConfig?.change_manager_id));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <PageTitle title="CR Policy" sub="Configure change management workflow and approval levels"
        action={<button onClick={addLevel} style={btn("primary")}>+ Add Approval Level</button>}/>

      {/* Change Manager Config */}
      <div style={card(20)}>
        <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:4}}>Fixed Change Manager</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>All change requests go to this person as the first approval gate.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"end"}}>
          <div>
            <label style={LBL}>Assign Change Manager</label>
            <select
              value={tenantConfig?.change_manager_id||""}
              onChange={e=>saveManager(e.target.value)}
              style={inp()}>
              <option value="">— Not configured —</option>
              {cmUser&&!changeManagerIds.has(cmUser.id)&&(
                <option value={cmUser.id}>{cmUser.name} ({cmUser.email}) — role no longer assigned</option>
              )}
              {changeManagerUsers.filter(u=>u.status==="active").map(u=>(
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            {changeManagerUsers.length===0&&<div style={{fontSize:11,color:C.amber,marginTop:6}}>No users have the Change Manager role assigned yet — assign it in Change Roles first.</div>}
          </div>
          {cmUser&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.greenBg,borderRadius:8,border:`1px solid ${C.green}30`}}>
              <Av i={cmUser.initials||"?"} s={28}/>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.ink}}>{cmUser.name}</div>
                <div style={{fontSize:10,color:C.green,fontWeight:600}}>Active Change Manager</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Escalation & Default SLAs */}
      <div style={card(20)}>
        <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:4}}>Escalation & Default SLAs</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Overdue approvals escalate to the Change Manager unless overridden. SLA (hours) and reminder (minutes before) apply to the Line Manager, Change Manager, and Implementation stages.</div>
        <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,cursor:"pointer",fontSize:13,color:C.ink,fontWeight:500}}>
          <input type="checkbox" checked={sameAsManager} onChange={e=>setSameAsManager(e.target.checked)}/>
          Use Change Manager as Escalation Authority
        </label>
        {!sameAsManager&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"end",marginBottom:14}}>
            <div>
              <label style={LBL}>Escalation Authority</label>
              <select
                value={escForm.escalation_authority_id}
                onChange={e=>setEscForm(p=>({...p,escalation_authority_id:e.target.value}))}
                style={inp()}>
                <option value="">— Not configured —</option>
                {users.filter(u=>u.status==="active").map(u=>(
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div style={{marginBottom:14}}>
          <label style={LBL}>Escalation CC Email (optional)</label>
          <input value={escForm.escalation_cc_email} onChange={e=>setEscForm(p=>({...p,escalation_cc_email:e.target.value}))}
            style={inp()} placeholder="e.g. it-leadership@africaprudential.com" type="email"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <label style={LBL}>Line Manager SLA (optional)</label>
            <input type="number" min={0} value={escForm.line_manager_sla_hours}
              onChange={e=>setEscForm(p=>({...p,line_manager_sla_hours:e.target.value}))} style={inp()} placeholder="e.g. 4 hrs"/>
          </div>
          <div>
            <label style={LBL}>Line Manager SLA Reminder (optional)</label>
            <input type="number" min={0} value={escForm.line_manager_reminder_before_minutes}
              onChange={e=>setEscForm(p=>({...p,line_manager_reminder_before_minutes:e.target.value}))} style={inp()} placeholder="e.g. 30 mins"/>
          </div>
          <div>
            <label style={LBL}>Change Manager SLA</label>
            <input type="number" min={0} value={escForm.manager_sla_hours}
              onChange={e=>setEscForm(p=>({...p,manager_sla_hours:e.target.value}))} style={inp()} placeholder="e.g. 2 hrs"/>
          </div>
          <div>
            <label style={LBL}>Change manager sla Reminder</label>
            <input type="number" min={0} value={escForm.manager_reminder_before_minutes}
              onChange={e=>setEscForm(p=>({...p,manager_reminder_before_minutes:e.target.value}))} style={inp()} placeholder="e.g. 30 mins"/>
          </div>
          <div>
            <label style={LBL}>Implementation SLA</label>
            <input type="number" min={0} value={escForm.implementation_sla_hours}
              onChange={e=>setEscForm(p=>({...p,implementation_sla_hours:e.target.value}))} style={inp()} placeholder="e.g. 2 hrs"/>
          </div>
          <div>
            <label style={LBL}>Implementation Reminder (minutes before)</label>
            <input type="number" min={0} value={escForm.implementation_reminder_before_minutes}
              onChange={e=>setEscForm(p=>({...p,implementation_reminder_before_minutes:e.target.value}))} style={inp()} placeholder="e.g. 30 mins"/>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={saveEscalation} disabled={savingEsc} style={btn("primary")}>{savingEsc?"Saving…":"Save Escalation Settings"}</button>
        </div>
      </div>

      {/* Approval Levels */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{fontSize:14,fontWeight:700,color:C.ink}}>Approval Levels</div>
        {(approvalLevels||[]).length===0&&(
          <div style={{...card(20),textAlign:"center",color:C.muted,fontSize:13}}>
            No approval levels configured. Click "+ Add Approval Level" to add one.
          </div>
        )}
        {(approvalLevels||[]).map((level,i)=>(
          <div key={level.id||i} style={card(16)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:C.brand,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{level.level_order}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:C.ink}}>{level.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{level.description||"No description"}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setEditing(level)} style={{...btn("ghost"),fontSize:11,padding:"4px 10px"}}>Edit</button>
                <button onClick={()=>removeLevel(level.id)} style={{...btn("ghost"),fontSize:11,padding:"4px 10px",color:C.red}}>Remove</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.violetBg,color:C.violet}}>
                Role: {(changeRoles||[]).find(r=>r.key===level.role_key)?.label||level.role_key}
              </span>
              {(level.change_types||[]).map(ct=>(
                <span key={ct} style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.blueBg,color:C.blue}}>{ct}</span>
              ))}
              {level.sla_hours!=null&&(
                <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.amberBg,color:C.amber}}>
                  SLA: {level.sla_hours}h{level.reminder_before_minutes!=null?` · Reminder: ${level.reminder_before_minutes}m before`:""}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Summary */}
      <div style={card(16)}>
        <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:12}}>Workflow Preview</div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          {["Technician Creates",`Change Manager`,
            ...(approvalLevels||[]).map(l=>l.name),
            "Implementer Executes","Closed"].map((step,i,arr)=>(
            <React.Fragment key={i}>
              <span style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,
                background:i===0?C.blueBg:i===arr.length-1?C.greenBg:i===1?C.violetBg:C.amberBg,
                color:i===0?C.blue:i===arr.length-1?C.green:i===1?C.violet:C.amber}}>
                {step}
              </span>
              {i<arr.length-1&&<span style={{color:C.muted,fontSize:14}}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editing&&(
        <Modal title={(approvalLevels||[]).some(l=>l.id===editing.id)?"Edit Approval Level":"New Approval Level"} onClose={()=>setEditing(null)} w={520}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={LBL}>Level Name</label>
              <input value={editing.name} onChange={e=>setEditing(p=>({...p,name:e.target.value}))} style={inp()} placeholder="e.g. Level 1 Approval"/>
            </div>
            <div>
              <label style={LBL}>Description</label>
              <input value={editing.description||""} onChange={e=>setEditing(p=>({...p,description:e.target.value}))} style={inp()} placeholder="e.g. CTO Level"/>
            </div>
            <div>
              <label style={LBL}>Level Order</label>
              <input type="number" min={1} value={editing.level_order} onChange={e=>setEditing(p=>({...p,level_order:+e.target.value}))} style={inp()}/>
            </div>
            <div>
              <label style={LBL}>Required Role</label>
              <div style={{display:"flex",gap:8}}>
                <select value={editing.role_key||""} onChange={e=>setEditing(p=>({...p,role_key:e.target.value}))} style={inp()}>
                  {(changeRoles||[]).filter(r=>r.key.includes("approver")).map(r=>(
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
                <AddRoleControl changeRoles={changeRoles} setChangeRoles={setChangeRoles} flash={flash}
                  onSaved={saved=>setEditing(p=>p?{...p, role_key:saved.key}:p)}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={LBL}>SLA (hours)</label>
                <input type="number" min={0} value={editing.sla_hours??""}
                  onChange={e=>setEditing(p=>({...p,sla_hours:e.target.value===""?null:+e.target.value}))} style={inp()} placeholder="e.g. 24"/>
              </div>
              <div>
                <label style={LBL}>Reminder (minutes before SLA)</label>
                <input type="number" min={0} value={editing.reminder_before_minutes??""}
                  onChange={e=>setEditing(p=>({...p,reminder_before_minutes:e.target.value===""?null:+e.target.value}))} style={inp()} placeholder="e.g. 120"/>
              </div>
            </div>
            <div>
              <label style={LBL}>Applies to Change Types</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {CHANGE_TYPES.map(ct=>{
                  const active = (editing.change_types||[]).includes(ct);
                  return (
                    <button key={ct} onClick={()=>setEditing(p=>({...p,change_types:active?p.change_types.filter(t=>t!==ct):[...(p.change_types||[]),ct]}))}
                      style={{padding:"5px 12px",border:`1.5px solid ${active?C.brand:C.border}`,borderRadius:6,
                        background:active?C.brandLt:"#fff",color:active?C.brand:C.muted,
                        fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      {ct}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <button onClick={()=>setEditing(null)} style={btn("ghost")}>Cancel</button>
            <button onClick={()=>saveLevel(editing)} disabled={saving} style={btn("primary")}>{saving?"Saving…":"Save Level"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

