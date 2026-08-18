import { useState } from "react";
import { Check } from "lucide-react";
import { C, btn, inp, sel, LBL } from "../../theme.js";
import { SUB_CATEGORIES, SUB_STATUSES, SUB_CYCLES, SUB_REMINDER_OPTS } from "../../constants.js";
import { Modal } from "../../components/ui.jsx";
import { isDirty as checkDirty } from "../../utils.js";

export default function SubModal({sub,depts,users,onClose,onSave}){
  const [d,setD]=useState(sub
    ?{name:sub.name,vendor:sub.vendor||"",category:sub.category||"Other",renewalDate:sub.renewalDate||"",billingCycle:sub.billingCycle||"Annual",cost:sub.cost||"",prevCost:sub.prevCost||"",status:sub.status||"active",notes:sub.notes||"",assignedOwners:sub.assignedOwners||[],assignedDept:sub.assignedDept||"",reminderSchedule:sub.reminderSchedule||["monthly"],invoiceFile:null}
    :{name:"",vendor:"",category:"Other",renewalDate:"",billingCycle:"Annual",cost:"",prevCost:"",status:"active",notes:"",assignedOwners:[],assignedDept:"",reminderSchedule:["monthly"],invoiceFile:null});
  const [initial]=useState(d);
  const [saving,setSaving]=useState(false);
  const dirty = !sub || !!d.invoiceFile || checkDirty(d,initial,["invoiceFile"]);
  const deptUsers = (users||[]).filter(u=>u.dept===d.assignedDept);
  // Keep any already-selected owner visible even if they're outside the
  // currently selected department (e.g. department changed after assignment).
  const extraOwners = (users||[]).filter(u=>d.assignedOwners.includes(u.id) && u.dept!==d.assignedDept);
  const ownerCandidates = [...deptUsers, ...extraOwners];

  const toggleReminder = (v) => {
    setD(p=>{
      const cur = p.reminderSchedule||[];
      return {...p, reminderSchedule: cur.includes(v) ? cur.filter(x=>x!==v) : [...cur,v]};
    });
  };

  const toggleOwner = (id) => {
    setD(p=>{
      const cur = p.assignedOwners||[];
      return {...p, assignedOwners: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur,id]};
    });
  };

  const submit = async () => {
    if(!d.name||!d.renewalDate) return;
    setSaving(true);
    try {
      await onSave(d);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={sub?"Edit Subscription":"Add Subscription"} onClose={onClose} w={620}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Subscription Name</label><input value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} style={inp()} placeholder="e.g. Figma"/></div>
        <div><label style={LBL}>Vendor</label><input value={d.vendor} onChange={e=>setD(p=>({...p,vendor:e.target.value}))} style={inp()} placeholder="e.g. Figma Inc."/></div>
        <div>
          <label style={LBL}>Category</label>
          <select value={d.category} onChange={e=>setD(p=>({...p,category:e.target.value}))} style={sel()}>
            {SUB_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Renewal Date</label><input type="date" value={d.renewalDate} onChange={e=>setD(p=>({...p,renewalDate:e.target.value}))} style={inp()}/></div>
        <div>
          <label style={LBL}>Billing Cycle</label>
          <select value={d.billingCycle} onChange={e=>setD(p=>({...p,billingCycle:e.target.value}))} style={sel()}>
            {SUB_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Cost (latest invoice)</label><input type="number" value={d.cost} onChange={e=>setD(p=>({...p,cost:e.target.value}))} style={inp()} placeholder="0.00"/></div>
        <div><label style={LBL}>Previous Cost (optional)</label><input type="number" value={d.prevCost} onChange={e=>setD(p=>({...p,prevCost:e.target.value}))} style={inp()} placeholder="0.00"/></div>
        <div>
          <label style={LBL}>Status</label>
          <select value={d.status} onChange={e=>setD(p=>({...p,status:e.target.value}))} style={sel()}>
            {SUB_STATUSES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
        <div>
          <label style={LBL}>Department</label>
          <select value={d.assignedDept} onChange={e=>setD(p=>({...p,assignedDept:e.target.value}))} style={sel()}>
            <option value="">Select department…</option>
            {(depts||[]).map(dept=><option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={LBL}>Assigned Owner(s) <span style={{textTransform:"none",fontWeight:500,color:C.muted}}>(select one or more)</span></label>
          {ownerCandidates.length>0
            ? <div style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:"#FAFAFA",maxHeight:150,overflowY:"auto"}}>
                {ownerCandidates.map(u=>{
                  const checked = d.assignedOwners.includes(u.id);
                  return (
                    <label key={u.id} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                      <input type="checkbox" checked={checked} onChange={()=>toggleOwner(u.id)}
                        style={{width:14,height:14,accentColor:C.brand,cursor:"pointer"}}/>
                      <span style={{fontSize:13,color:C.ink}}>{u.name}</span>
                      {u.dept!==d.assignedDept&&<span style={{fontSize:11,color:C.muted}}>({u.dept})</span>}
                    </label>
                  );
                })}
              </div>
            : <div style={{fontSize:12,color:C.muted,padding:"8px 0"}}>
                {d.assignedDept?"No users found in this department.":"Select a department first…"}
              </div>}
        </div>

        {/* REMINDER SCHEDULE */}
        <div style={{gridColumn:"1/-1"}}>
          <label style={LBL}>Reminder Schedule <span style={{textTransform:"none",fontWeight:500,color:C.muted}}>(select one or more)</span></label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
            {SUB_REMINDER_OPTS.map(opt=>{
              const active = (d.reminderSchedule||[]).includes(opt.v);
              return (
                <button key={opt.v} type="button" onClick={()=>toggleReminder(opt.v)}
                  style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit",
                    border:`1.5px solid ${active?C.brand:C.border}`,
                    background:active?C.brandLt:"#fff",
                    color:active?C.brand:C.muted,display:"inline-flex",alignItems:"center",gap:4}}>
                  {active?<Check size={12}/>:""}{opt.l}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Notes</label><textarea value={d.notes} onChange={e=>setD(p=>({...p,notes:e.target.value}))} style={{...inp(),minHeight:56,resize:"vertical"}} placeholder="Additional notes…"/></div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={LBL}>Invoice Attachment {sub?.attachmentUrl&&<span style={{color:C.blue,fontWeight:500,textTransform:"none"}}>— <a href={sub.attachmentUrl} target="_blank" rel="noreferrer" style={{color:C.blue}}>view current</a></span>}</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setD(p=>({...p,invoiceFile:e.target.files[0]||null}))} style={{...inp(),padding:"5px 8px",fontSize:11,cursor:"pointer"}}/>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} disabled={saving} style={btn("ghost")}>Cancel</button>
        <button onClick={submit} disabled={saving||!d.name||!d.renewalDate||!dirty}
          style={{...btn("primary"),minWidth:150,justifyContent:"center",opacity:saving||!d.name||!d.renewalDate||!dirty?0.6:1}}>
          {saving?"Saving…":(sub?"Save Changes":"Add Subscription")}
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════════════════
