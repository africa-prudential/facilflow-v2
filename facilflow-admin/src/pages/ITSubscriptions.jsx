import { useState, useEffect } from "react";
import { AlertTriangle, CreditCard, Paperclip } from "lucide-react";
import { C, btn, inp, sel, card, LBL } from "../theme.js";
import { SUB_STATUSES, SUB_CYCLES } from "../constants.js";
import { genId, now, normSub, fmtSafe, exportCSV, humanize, resolveNames } from "../utils.js";
import { createSubscription, updateSubscription, uploadSubInvoice } from "../lib/supabase.js";
import { Chip, PageTitle, TH, Empty } from "../components/ui.jsx";
import SubDetailModal from "./forms/SubDetailModal.jsx";
import SubModal from "./forms/SubModal.jsx";

export default function ITSubscriptions({ctx}){
  const {subscriptions,setSubs,addAudit,flash,tid,uid,users,departments}=ctx;
  const [f,setF]          = useState({});
  const [modal,setModal]  = useState(null);
  const [detail,setDetail]= useState(null);
  const [page,setPage]    = useState(1);
  const [pageSize,setPageSize] = useState(20);

  const depts = [...new Set((departments||[]).map(d=>d.name))].sort();

  // Auto-detect pending_renewal status on load
  useEffect(()=>{
    const now = new Date();
    const toUpdate = subscriptions.filter(s=>{
      if(s.status!=="active") return false;
      const days = Math.ceil((new Date(s.renewalDate)-now)/86400000);
      return days <= 30 && days >= 0;
    });
    if(toUpdate.length>0){
      setSubs(p=>p.map(s=>{
        if(s.status!=="active") return s;
        const days = Math.ceil((new Date(s.renewalDate)-now)/86400000);
        if(days<=30 && days>=0) return {...s, status:"pending_renewal"};
        if(days<0) return {...s, status:"expired"};
        return s;
      }));
    }
  },[]);

  const shown = subscriptions.filter(s=>{
    if(f.status    && s.status!==f.status)       return false;
    if(f.category  && s.category!==f.category)   return false;
    if(f.cycle     && s.billingCycle!==f.cycle)   return false;
    if(f.dept      && s.assignedDept!==f.dept)    return false;
    if(f.vendor){const q=f.vendor.toLowerCase();if(!(s.vendor||"").toLowerCase().includes(q)) return false;}
    if(f.owner){const q=f.owner.toLowerCase();if(!resolveNames(s.assignedOwners,users).toLowerCase().includes(q)) return false;}
    if(f.renewal_from && s.renewalDate < f.renewal_from) return false;
    if(f.renewal_to   && s.renewalDate > f.renewal_to)   return false;
    if(f.q){
      const q=f.q.toLowerCase();
      if(!s.name.toLowerCase().includes(q)
        &&!(s.vendor||"").toLowerCase().includes(q)
        &&!resolveNames(s.assignedOwners,users).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);

  // Reset page on filter/page-size change
  useEffect(()=>{ setPage(1); },[f,pageSize]);

  const expiringSoon = subscriptions.filter(s=>{
    if(s.status==="cancelled"||s.status==="expired") return false;
    const days=Math.ceil((new Date(s.renewalDate)-new Date())/86400000);
    return days>=0&&days<=7;
  });

  const saveSub = async(data,existing)=>{
    try{
      let attachmentUrl = existing?.attachmentUrl||null;
      if(data.invoiceFile){
        flash("Uploading invoice…");
        const up = await uploadSubInvoice(existing?.id||genId("SUB"),data.invoiceFile);
        attachmentUrl = up.publicUrl;
      }
      const rec={
        name:data.name, vendor:data.vendor, category:data.category,
        renewal_date:data.renewalDate, billing_cycle:data.billingCycle,
        cost:parseFloat(data.cost)||0,
        prev_cost:data.prevCost?parseFloat(data.prevCost):null,
        status:data.status, notes:data.notes||"",
        attachment_url:attachmentUrl,
        assigned_owners:data.assignedOwners||[],
        assigned_dept:data.assignedDept||"",
        reminder_schedule:data.reminderSchedule||["monthly"],
        tenant_id:tid,
      };
      if(existing){
        const saved=await updateSubscription(existing.id,rec);
        setSubs(p=>p.map(s=>s.id!==existing.id?s:normSub(saved)));
        addAudit("SUB_UPDATED",existing.id,`${data.name} subscription updated`);
        flash("Subscription updated");
      } else {
        const saved=await createSubscription({...rec,id:genId("SUB")});
        setSubs(p=>[normSub(saved),...p]);
        addAudit("SUB_ADDED",saved.id,`${data.name} subscription added`);
        flash("Subscription added");
      }
    }catch(e){flash(e.message,"error");}
  };

  const subStatusChip = (s)=>{
    const m=SUB_STATUSES.find(x=>x.v===s)||{l:s,color:C.muted,bg:"#F8FAFC"};
    return <Chip label={m.l} color={m.color} bg={m.bg}/>;
  };

  const renewalUrgency = (renewalDate,status)=>{
    if(status==="cancelled"||status==="expired") return null;
    const days=Math.ceil((new Date(renewalDate)-new Date())/86400000);
    if(days<0)   return <span style={{fontSize:10,fontWeight:700,color:C.red,marginLeft:4}}>OVERDUE</span>;
    if(days<=7)  return <span style={{fontSize:10,fontWeight:700,color:C.red,marginLeft:4}}>{days}d</span>;
    if(days<=30) return <span style={{fontSize:10,fontWeight:700,color:C.amber,marginLeft:4}}>{days}d</span>;
    return null;
  };

  const cats=[...new Set(subscriptions.map(s=>s.category).filter(Boolean))].sort();
  const vendors=[...new Set(subscriptions.map(s=>s.vendor).filter(Boolean))].sort();

  const exportSubs = () => {
    if(shown.length===0){ flash("No subscriptions to export","error"); return; }
    const rows = shown.map(s=>({...s, ownerNames:resolveNames(s.assignedOwners,users)}));
    exportCSV(`it-subscriptions-${new Date().toISOString().slice(0,10)}.csv`, [
      {key:"name",           label:"Subscription"},
      {key:"vendor",         label:"Vendor"},
      {key:"category",       label:"Category"},
      {key:"cost",           label:"Cost (NGN)"},
      {key:"prevCost",       label:"Previous Cost (NGN)"},
      {key:"billingCycle",   label:"Billing Cycle"},
      {key:"renewalDate",    label:"Renewal Date"},
      {key:"status",         label:"Status"},
      {key:"ownerNames",     label:"Owner(s)"},
      {key:"assignedDept",   label:"Department"},
      {key:"notes",          label:"Notes"},
      {key:"lastUpdated",    label:"Last Updated"},
    ], rows);
    flash(`Exported ${shown.length} subscription(s)`);
  };

  return (
    <div>
      <PageTitle title="IT Subscriptions" sub="Track SaaS tools, renewals, billing cycles and reminders"
        action={<div style={{display:"flex",gap:8}}>
          <button onClick={exportSubs} style={btn("ghost")}>Export CSV</button>
          <button onClick={()=>setModal("add")} style={btn("primary")}>+ Add Subscription</button>
        </div>}/>

      {expiringSoon.length>0&&(
        <div style={{padding:"10px 16px",borderRadius:8,background:C.amberBg,border:`1px solid ${C.amber}40`,marginBottom:14,fontSize:12,color:C.amber,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
          <AlertTriangle size={14}/> {expiringSoon.length} subscription(s) renewing within 7 days — review and action.
        </div>
      )}

      {/* ── FILTER PANEL ── */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",padding:"12px 14px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16,alignItems:"flex-end"}}>
        <div style={{minWidth:220}}>
          <label style={LBL}>Search</label>
          <input value={f.q||""} placeholder="Name, vendor or owner…" onChange={e=>setF(p=>({...p,q:e.target.value}))} style={{...inp(),padding:"6px 9px",fontSize:12}}/>
        </div>
        <div style={{minWidth:140}}>
          <label style={LBL}>Status</label>
          <select value={f.status||""} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={{...sel(),padding:"6px 9px",fontSize:12}}>
            <option value="">All</option>
            {SUB_STATUSES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
        <div style={{minWidth:140}}>
          <label style={LBL}>Billing Cycle</label>
          <select value={f.cycle||""} onChange={e=>setF(p=>({...p,cycle:e.target.value}))} style={{...sel(),padding:"6px 9px",fontSize:12}}>
            <option value="">All</option>
            {SUB_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{minWidth:140}}>
          <label style={LBL}>Category</label>
          <select value={f.category||""} onChange={e=>setF(p=>({...p,category:e.target.value}))} style={{...sel(),padding:"6px 9px",fontSize:12}}>
            <option value="">All</option>
            {cats.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{minWidth:140}}>
          <label style={LBL}>Vendor</label>
          <select value={f.vendor||""} onChange={e=>setF(p=>({...p,vendor:e.target.value}))} style={{...sel(),padding:"6px 9px",fontSize:12}}>
            <option value="">All</option>
            {vendors.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{minWidth:140}}>
          <label style={LBL}>Department</label>
          <select value={f.dept||""} onChange={e=>setF(p=>({...p,dept:e.target.value}))} style={{...sel(),padding:"6px 9px",fontSize:12}}>
            <option value="">All</option>
            {depts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{minWidth:130}}>
          <label style={LBL}>Owner</label>
          <input value={f.owner||""} placeholder="Owner name…" onChange={e=>setF(p=>({...p,owner:e.target.value}))} style={{...inp(),padding:"6px 9px",fontSize:12}}/>
        </div>
        <div style={{minWidth:130}}>
          <label style={LBL}>Renewal From</label>
          <input type="date" value={f.renewal_from||""} onChange={e=>setF(p=>({...p,renewal_from:e.target.value}))} style={{...inp(),padding:"6px 9px",fontSize:12}}/>
        </div>
        <div style={{minWidth:130}}>
          <label style={LBL}>Renewal To</label>
          <input type="date" value={f.renewal_to||""} onChange={e=>setF(p=>({...p,renewal_to:e.target.value}))} style={{...inp(),padding:"6px 9px",fontSize:12}}/>
        </div>
        <button onClick={()=>setF({})} style={{...btn("ghost"),padding:"6px 12px",fontSize:11,alignSelf:"flex-end"}}>Clear</button>
      </div>

      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Subscription","Vendor","Cost (₦)","Cycle","Renewal Date","Status","Dept / Owner","Last Updated",""]}/>
          <tbody>
            {paged.length===0
              ?<tr><td colSpan={9}><Empty icon={<CreditCard size={32}/>} title="No subscriptions found"/></td></tr>
              :paged.map((s,i)=>{
                const rowBg = s.status==="expired"?`${C.red}06`:s.status==="pending_renewal"?`${C.amber}06`:"transparent";
                return (
                  <tr key={s.id} onClick={()=>setDetail(s)} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none",background:rowBg,cursor:"pointer"}}>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{s.name}</div>
                      {s.category&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>{humanize(s.category)}</div>}
                    </td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{s.vendor||"—"}</td>
                    <td style={{padding:"11px 14px",fontSize:13,fontWeight:700,color:C.ink}}>
                      {s.cost?`₦${Number(s.cost).toLocaleString()}`:"—"}
                      {s.prevCost!=null&&s.prevCost!==s.cost&&<div style={{fontSize:10,color:Number(s.cost)>Number(s.prevCost)?C.red:C.green,fontWeight:600}}>prev: ₦{Number(s.prevCost).toLocaleString()}</div>}
                    </td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{s.billingCycle}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.ink,whiteSpace:"nowrap"}}>
                      {fmtSafe(s.renewalDate+"T12:00:00")}
                      {renewalUrgency(s.renewalDate,s.status)}
                    </td>
                    <td style={{padding:"11px 14px"}}>{subStatusChip(s.status)}</td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{fontSize:12,color:C.ink2}}>{resolveNames(s.assignedOwners,users)||"—"}</div>
                      {s.assignedDept&&<div style={{fontSize:10,color:C.muted}}>{s.assignedDept}</div>}
                    </td>
                    <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtSafe(s.lastUpdated)}</td>
                    <td style={{padding:"11px 14px"}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:5,alignItems:"center"}}>
                        {s.attachmentUrl&&<a href={s.attachmentUrl} target="_blank" rel="noreferrer" style={{...btn("ghost"),fontSize:11,padding:"4px 8px",textDecoration:"none",color:C.blue,display:"inline-flex",alignItems:"center"}}><Paperclip size={14}/></a>}
                        <button onClick={()=>setModal({edit:s})} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderTop:`1px solid #FAFAFA`}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:C.muted}}>Rows per page</span>
            <select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}
              style={{fontSize:12,padding:"4px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.ink}}>
              {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {totalPages>1&&(
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <button onClick={()=>setPage(1)} disabled={page===1} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>«</button>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>‹</button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                const pg=Math.max(1,Math.min(page-2,totalPages-4))+i;
                if(pg<1||pg>totalPages) return null;
                return <button key={pg} onClick={()=>setPage(pg)} style={{...btn(pg===page?"primary":"ghost"),padding:"4px 10px",fontSize:12,minWidth:32}}>{pg}</button>;
              })}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>›</button>
              <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>»</button>
              <span style={{fontSize:11,color:C.muted,marginLeft:6}}>Page {page} of {totalPages}</span>
            </div>
          )}
        </div>
      </div>

      {modal==="add"&&<SubModal depts={depts} users={users} onClose={()=>setModal(null)} onSave={d=>saveSub(d,null)}/>}
      {modal?.edit&&<SubModal sub={modal.edit} depts={depts} users={users} onClose={()=>setModal(null)} onSave={d=>saveSub(d,modal.edit)}/>}
      {detail&&<SubDetailModal sub={detail} depts={depts} users={users} onClose={()=>setDetail(null)} onEdit={s=>{setDetail(null);setModal({edit:s});}}/>}
    </div>
  );
}

