import { useState } from "react";
import { C, btn, inp, LBL } from "../../theme.js";
import { SUB_CATEGORIES, SUB_STATUSES, SUB_CYCLES, SUB_REMINDER_OPTS } from "../../constants.js";
import { Modal } from "../../components/ui.jsx";

export default function SubModal({sub,depts,onClose,onSave}){
  const [d,setD]=useState(sub
    ?{name:sub.name,vendor:sub.vendor||"",category:sub.category||"Other",renewalDate:sub.renewalDate||"",billingCycle:sub.billingCycle||"Annual",cost:sub.cost||"",prevCost:sub.prevCost||"",status:sub.status||"active",notes:sub.notes||"",assignedOwner:sub.assignedOwner||"",assignedDept:sub.assignedDept||"",reminderSchedule:sub.reminderSchedule||["monthly"],invoiceFile:null}
    :{name:"",vendor:"",category:"Other",renewalDate:"",billingCycle:"Annual",cost:"",prevCost:"",status:"active",notes:"",assignedOwner:"",assignedDept:"",reminderSchedule:["monthly"],invoiceFile:null});
  const [saving,setSaving]=useState(false);

  const toggleReminder = (v) => {
    setD(p=>{
      const cur = p.reminderSchedule||[];
      return {...p, reminderSchedule: cur.includes(v) ? cur.filter(x=>x!==v) : [...cur,v]};
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
          <select value={d.category} onChange={e=>setD(p=>({...p,category:e.target.value}))} style={inp()}>
            {SUB_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Renewal Date</label><input type="date" value={d.renewalDate} onChange={e=>setD(p=>({...p,renewalDate:e.target.value}))} style={inp()}/></div>
        <div>
          <label style={LBL}>Billing Cycle</label>
          <select value={d.billingCycle} onChange={e=>setD(p=>({...p,billingCycle:e.target.value}))} style={inp()}>
            {SUB_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Cost (latest invoice)</label><input type="number" value={d.cost} onChange={e=>setD(p=>({...p,cost:e.target.value}))} style={inp()} placeholder="0.00"/></div>
        <div><label style={LBL}>Previous Cost (optional)</label><input type="number" value={d.prevCost} onChange={e=>setD(p=>({...p,prevCost:e.target.value}))} style={inp()} placeholder="0.00"/></div>
        <div>
          <label style={LBL}>Status</label>
          <select value={d.status} onChange={e=>setD(p=>({...p,status:e.target.value}))} style={inp()}>
            {SUB_STATUSES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
        <div>
          <label style={LBL}>Department</label>
          <select value={d.assignedDept} onChange={e=>setD(p=>({...p,assignedDept:e.target.value}))} style={inp()}>
            <option value="">Select department…</option>
            {(depts||[]).map(dept=><option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Assigned Owner</label><input value={d.assignedOwner} onChange={e=>setD(p=>({...p,assignedOwner:e.target.value}))} style={inp()} placeholder="Person responsible…"/></div>

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
                    color:active?C.brand:C.muted}}>
                  {active?"✓ ":""}{opt.l}
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
        <button onClick={submit} disabled={saving||!d.name||!d.renewalDate} style={{...btn("primary"),opacity:saving||!d.name||!d.renewalDate?0.6:1}}>
          {saving?"Saving…":(sub?"Save Changes":"Add Subscription")}
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════════════════
