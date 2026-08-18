import { Paperclip } from "lucide-react";
import { C, btn } from "../../theme.js";
import { SUB_STATUSES, SUB_REMINDER_OPTS } from "../../constants.js";
import { fmtSafe, resolveNames } from "../../utils.js";
import { Chip, Modal } from "../../components/ui.jsx";

export default function SubDetailModal({sub,depts,users,onClose,onEdit}){
  const st = SUB_STATUSES.find(x=>x.v===sub.status)||{l:sub.status,color:C.muted,bg:"#F8FAFC"};
  const days = Math.ceil((new Date(sub.renewalDate)-new Date())/86400000);
  const reminders = (sub.reminderSchedule||["monthly"]).map(r=>SUB_REMINDER_OPTS.find(o=>o.v===r)?.l||r);

  return (
    <Modal title={sub.name} sub={`${sub.vendor||""} · ${sub.category||""}`} onClose={onClose} w={640}>
      {/* Status + cycle header */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,padding:"10px 12px",background:C.pageBg,borderRadius:8}}>
        <Chip label={st.l} color={st.color} bg={st.bg}/>
        <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:"#fff",border:`1px solid ${C.border}`,color:C.muted}}>{sub.billingCycle}</span>
        {days>=0&&days<=30&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:4,background:days<=7?C.redBg:C.amberBg,color:days<=7?C.red:C.amber}}>Renews in {days}d</span>}
        {days<0&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:4,background:C.redBg,color:C.red}}>Overdue {Math.abs(days)}d</span>}
      </div>

      {/* Detail grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[["Vendor",sub.vendor],["Category",sub.category],["Cost",sub.cost?`₦${Number(sub.cost).toLocaleString()}`:"—"],["Previous Cost",sub.prevCost!=null?`₦${Number(sub.prevCost).toLocaleString()}`:"—"],["Billing Cycle",sub.billingCycle],["Renewal Date",fmtSafe(sub.renewalDate+"T12:00:00")],["Assigned Owner(s)",resolveNames(sub.assignedOwners,users)||"—"],["Department",sub.assignedDept||"—"],["Reminders",reminders.join(", ")],["Last Updated",fmtSafe(sub.lastUpdated)]].map(([k,v])=>(
          <div key={k} style={{background:C.pageBg,borderRadius:7,padding:"10px 12px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>{k}</div>
            <div style={{fontSize:13,color:C.ink,fontWeight:500}}>{String(v||"—")}</div>
          </div>
        ))}
      </div>

      {sub.notes&&(
        <div style={{background:C.pageBg,borderRadius:7,padding:"12px 14px",marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Notes</div>
          <div style={{fontSize:13,color:C.ink,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{sub.notes}</div>
        </div>
      )}

      {sub.attachmentUrl&&(
        <div style={{marginBottom:16}}>
          <a href={sub.attachmentUrl} target="_blank" rel="noreferrer" style={{color:C.blue,textDecoration:"none",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}><Paperclip size={14}/> View Invoice Attachment</a>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Close</button>
        <button onClick={()=>onEdit(sub)} style={btn("primary")}>Edit Subscription</button>
      </div>
    </Modal>
  );
}

