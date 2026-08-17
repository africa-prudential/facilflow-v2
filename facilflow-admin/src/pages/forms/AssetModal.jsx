import { useState } from "react";
import { User, AlertTriangle, ClipboardList, Check } from "lucide-react";
import { C, btn, inp, sel, LBL } from "../../theme.js";
import { ASSET_STATUS, ASSET_CATS } from "../../constants.js";
import { fmtSafe, isDirty } from "../../utils.js";
import { Modal, Empty } from "../../components/ui.jsx";

export default function AssetModal({asset,users,onClose,onSave}){
  const isNew=!asset;
  const [form,setForm]=useState(asset||{status:"available",category:"Laptop"});
  const [initialForm]=useState(form);
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState("details");
  const [assignNote,setAssignNote]=useState("");
  const dirty = isNew || isDirty(form,initialForm) || !!assignNote.trim();

  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handleSave=async()=>{
    if(!form.name?.trim()){ alert("Asset name is required."); return; }
    setSaving(true);
    try{
      const today=new Date().toISOString().split("T")[0];
      const prevAssignee=asset?.assigned_to||null;
      const newAssignee=form.assigned_to||null;
      let history=[...(asset?.usage_history||[])];

      if(!isNew && prevAssignee!==newAssignee){
        // Close the last open entry for the previous assignee
        if(prevAssignee){
          let closedOne=false;
          history=history.map(h=>{
            if(!h.returned_date&&!closedOne){closedOne=true;return {...h,returned_date:form.assigned_date||today};}
            return h;
          });
        }
        // Open a new entry for the new assignee
        if(newAssignee){
          const name=users.find(u=>u.id===newAssignee)?.name||newAssignee;
          history=[...history,{
            assigned_to:newAssignee,
            assigned_to_name:name,
            assigned_date:form.assigned_date||today,
            returned_date:null,
            notes:assignNote.trim()||"",
          }];
        }
      }

      // Auto-set status when assigning/unassigning
      let status=form.status;
      if(!isNew && prevAssignee!==newAssignee){
        if(newAssignee && status!=="assigned") status="assigned";
        if(!newAssignee && status==="assigned") status="available";
      }

      await onSave(form.id,{...form,status,usage_history:history});
      onClose();
    }catch(e){ alert(e.message); }
    finally{ setSaving(false); }
  };

  const history=[...(asset?.usage_history||[])].reverse(); // newest first
  const prevAssignee=asset?.assigned_to||null;
  const newAssignee=form.assigned_to||null;
  const assigneeChanged=!isNew&&prevAssignee!==newAssignee;

  return (
    <Modal title={isNew?"New Asset":form.name||"Asset"} sub={isNew?"Add a new asset to the registry":"Manage asset details and assignment"} onClose={onClose} w={700}>
      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {["details","assignment","history"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            ...btn(tab===t?"primary":"ghost"),
            fontSize:12,padding:"5px 14px",textTransform:"capitalize",
            position:"relative",
          }}>
            {t}
            {t==="history"&&history.length>0&&(
              <span style={{marginLeft:6,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10,
                background:tab==="history"?"rgba(255,255,255,.3)":C.brand,color:"#fff"}}>{history.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ── */}
      {tab==="details"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[
            {l:"Asset Name *",k:"name",span:2},
            {l:"Brand",k:"brand"},{l:"Model",k:"model"},
            {l:"Serial Number",k:"serial_number"},{l:"Asset Tag",k:"asset_tag"},
            {l:"Category",k:"category",type:"select",opts:ASSET_CATS},
            {l:"Status",k:"status",type:"select",opts:Object.keys(ASSET_STATUS)},
            {l:"Department",k:"department"},{l:"Purchase Date",k:"purchase_date",type:"date"},
            {l:"Purchase Cost (₦)",k:"purchase_cost",type:"number"},{l:"Warranty Expiry",k:"warranty_expiry",type:"date"},
          ].map(f=>(
            <div key={f.k} style={{gridColumn:f.span===2?"1 / -1":"auto"}}>
              <label style={LBL}>{f.l}</label>
              {f.type==="select"
                ?<select value={form[f.k]||""} onChange={e=>set(f.k,e.target.value)} style={{...sel(),fontSize:12}}>
                   <option value="">Select…</option>
                   {f.opts.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o} value={o}>{ASSET_STATUS[o]?.label||o}</option>)}
                 </select>
                :<input type={f.type||"text"} value={form[f.k]||""} onChange={e=>set(f.k,f.type==="number"?Number(e.target.value):e.target.value)} style={{...inp(),fontSize:12}}/>}
            </div>
          ))}
          <div style={{gridColumn:"1 / -1"}}>
            <label style={LBL}>Notes</label>
            <textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} style={{...inp(),resize:"none",minHeight:70,fontSize:12}}/>
          </div>
        </div>
      )}

      {/* ── ASSIGNMENT TAB ── */}
      {tab==="assignment"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Current assignment banner */}
          {prevAssignee&&(
            <div style={{padding:"12px 14px",borderRadius:8,background:C.surface,border:`1px solid ${C.border}`,fontSize:12,color:C.ink2,display:"flex",alignItems:"center",gap:10}}>
              <User size={16}/>
              <div>
                <div style={{fontWeight:700,color:C.ink}}>Currently assigned to: {users.find(u=>u.id===prevAssignee)?.name||prevAssignee}</div>
                {asset?.assigned_date&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>Since {fmtSafe(asset.assigned_date)}</div>}
              </div>
            </div>
          )}
          <div>
            <label style={LBL}>Assign To</label>
            <select value={form.assigned_to||""} onChange={e=>set("assigned_to",e.target.value||null)} style={{...sel(),fontSize:12}}>
              <option value="">— Unassigned —</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name} — {u.dept||u.department||""}</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={LBL}>Effective Date</label>
              <input type="date" value={form.assigned_date||""} onChange={e=>set("assigned_date",e.target.value)} style={{...inp(),fontSize:12}}/>
            </div>
            <div>
              <label style={LBL}>Status</label>
              <select value={form.status||"available"} onChange={e=>set("status",e.target.value)} style={{...sel(),fontSize:12}}>
                {Object.entries(ASSET_STATUS).map(([v,m])=><option key={v} value={v}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={LBL}>Assignment Note (optional)</label>
            <input value={assignNote} onChange={e=>setAssignNote(e.target.value)} placeholder="e.g. Replacing old laptop, new hire kit…" style={{...inp(),fontSize:12}}/>
          </div>
          {assigneeChanged&&(
            <div style={{padding:"12px 14px",borderRadius:8,
              background:newAssignee?C.greenBg:C.amberBg,
              border:`1px solid ${newAssignee?C.green:C.amber}30`,
              fontSize:12,color:newAssignee?C.green:C.amber,fontWeight:600,display:"flex",alignItems:"flex-start",gap:6}}>
              {newAssignee
                ?<><Check size={14} style={{flexShrink:0,marginTop:1}}/> Will be assigned to {users.find(u=>u.id===newAssignee)?.name||"new user"} — history will be updated on save.</>
                :<><AlertTriangle size={14} style={{flexShrink:0,marginTop:1}}/> Asset will be unassigned — previous assignment will be closed in history.</>}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab==="history"&&(
        <div>
          {history.length===0
            ?<Empty icon={<ClipboardList size={32}/>} title="No assignment history yet" sub="History is recorded automatically each time this asset is assigned or reassigned"/>
            :<div style={{display:"flex",flexDirection:"column",gap:10}}>
               {history.map((h,i)=>{
                 const isCurrent=!h.returned_date;
                 return (
                   <div key={i} style={{
                     borderRadius:9,padding:"14px 16px",
                     border:`1px solid ${isCurrent?C.green:C.border}`,
                     background:isCurrent?C.greenBg:"#FAFAFA",
                     display:"grid",gridTemplateColumns:"28px 1fr auto",gap:12,alignItems:"start",
                   }}>
                     {/* Timeline dot */}
                     <div style={{width:28,height:28,borderRadius:"50%",
                       background:isCurrent?C.green:C.muted,color:"#fff",
                       display:"flex",alignItems:"center",justifyContent:"center",
                       fontSize:13,marginTop:1,flexShrink:0}}>
                       {isCurrent?<User size={13}/>:<Check size={13}/>}
                     </div>
                     <div>
                       <div style={{fontSize:14,fontWeight:700,color:C.ink}}>{h.assigned_to_name||"Unknown User"}</div>
                       <div style={{fontSize:12,color:C.muted,marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
                         <span>From: <strong style={{color:C.ink2}}>{h.assigned_date?fmtSafe(h.assigned_date):"—"}</strong></span>
                         <span>·</span>
                         <span>To: <strong style={{color:isCurrent?C.green:C.ink2}}>{h.returned_date?fmtSafe(h.returned_date):"Present"}</strong></span>
                       </div>
                       {h.notes&&<div style={{fontSize:11,color:C.muted,marginTop:5,fontStyle:"italic"}}>"{h.notes}"</div>}
                     </div>
                     {isCurrent&&(
                       <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:10,background:C.green,color:"#fff",alignSelf:"center"}}>
                         CURRENT
                       </span>
                     )}
                   </div>
                 );
               })}
             </div>
          }
        </div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={{...btn("ghost")}}>Cancel</button>
        <button onClick={handleSave} disabled={saving||!form.name?.trim()||!dirty}
          style={{...btn("primary"),minWidth:130,justifyContent:"center",opacity:saving||!form.name?.trim()||!dirty?0.6:1}}>
          {saving?"Saving…":isNew?"Create Asset":"Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
