import { useState, useEffect } from "react";
import { Mail, Bell } from "lucide-react";
import { C, btn, inp, card, LBL } from "../theme.js";
import { DEFAULT_TRIGGERS } from "../constants.js";
import { Modal, PageTitle, TH } from "../components/ui.jsx";
import { saveTenantConfig } from "../lib/supabase.js";

export default function NotifPolicy({ctx}){
  const {flash,tenantConfig,setTenantConfig,tid}=ctx;
  const [triggers,setTriggers]=useState(()=>tenantConfig?.notification_policies||DEFAULT_TRIGGERS);
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);

  // Sync from DB when tenantConfig loads after initial render
  useEffect(()=>{
    if(tenantConfig?.notification_policies) setTriggers(tenantConfig.notification_policies);
  },[tenantConfig]);

  const toggle=(id)=>setTriggers(p=>p.map(t=>t.id!==id?t:{...t,enabled:!t.enabled}));
  const toggleCh=(id,ch)=>setTriggers(p=>p.map(t=>t.id!==id?t:{...t,channels:t.channels.includes(ch)?t.channels.filter(c=>c!==ch):[...t.channels,ch]}));

  const savePolicies=async()=>{
    // Validate reminder hours
    const invalid=triggers.find(t=>!Number.isInteger(t.reminder)||t.reminder<0);
    if(invalid){ flash(`Reminder hours for "${invalid.event}" must be a non-negative whole number`,"error"); return; }
    setSaving(true);
    try{
      const saved=await saveTenantConfig(tid,{notification_policies:triggers});
      setTenantConfig(p=>({...p,...saved,notification_policies:triggers}));
      flash("Notification policies saved");
    }catch(e){ flash(e.message||"Failed to save policies","error"); }
    finally{ setSaving(false); }
  };

  return (
    <div>
      <PageTitle title="Notification Policies" sub="Configure triggers, templates and reminder intervals"
        action={<button onClick={savePolicies} disabled={saving} style={btn("primary")}>{saving?"Saving…":"Save Policies"}</button>}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Event","Enabled","Channels","Reminder (hrs)","Template",""]}/>
          <tbody>
            {triggers.map((t,i)=>(
              <tr key={t.id} style={{borderBottom:i<triggers.length-1?`1px solid #FAFAFA`:"none"}}>
                <td style={{padding:"12px 14px",fontSize:13,fontWeight:600,color:C.ink}}>{t.event}</td>
                <td style={{padding:"12px 14px"}}>
                  <div onClick={()=>toggle(t.id)} style={{width:40,height:22,borderRadius:11,
                    background:t.enabled?C.green:C.border,cursor:"pointer",position:"relative",transition:"background .2s"}}>
                    <div style={{position:"absolute",top:3,left:t.enabled?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                  </div>
                </td>
                <td style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",gap:6}}>
                    {["email","in_app"].map(ch=>(
                      <button key={ch} onClick={()=>toggleCh(t.id,ch)} style={{padding:"3px 8px",borderRadius:4,fontSize:11,fontWeight:600,fontFamily:"inherit",cursor:"pointer",
                        border:`1px solid ${t.channels.includes(ch)?C.blue:C.border}`,
                        background:t.channels.includes(ch)?C.blueBg:"transparent",
                        color:t.channels.includes(ch)?C.blue:C.muted,display:"inline-flex",alignItems:"center",gap:4}}>
                        {ch==="email"?<><Mail size={12}/> Email</>:<><Bell size={12}/> In-App</>}
                      </button>
                    ))}
                  </div>
                </td>
                <td style={{padding:"12px 14px"}}>
                  <input type="number" min={0} value={t.reminder}
                    onChange={e=>setTriggers(p=>p.map(tr=>tr.id!==t.id?tr:{...tr,reminder:+e.target.value}))}
                    style={{...inp(),width:70,padding:"5px 8px",fontSize:12}}/>
                </td>
                <td style={{padding:"12px 14px",fontSize:11,color:C.muted,maxWidth:280}}>
                  <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.template}</div>
                </td>
                <td style={{padding:"12px 14px"}}>
                  <button onClick={()=>setEditing(t)} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing&&(
        <Modal title="Edit Notification Template" sub={editing.event} onClose={()=>setEditing(null)} w={560}>
          <div style={{marginBottom:14,fontSize:11,color:C.muted,background:C.pageBg,borderRadius:6,padding:"8px 12px"}}>
            Available variables: <code style={{color:C.violet}}>{"{cr_id} {user} {approver} {date} {time} {reason} {item} {qty} {plate} {status}"}</code>
          </div>
          <div><label style={LBL}>Email Template</label>
            <textarea value={editing.template}
              onChange={e=>setEditing(p=>({...p,template:e.target.value}))}
              style={{...inp(),minHeight:100,resize:"vertical"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <button onClick={()=>setEditing(null)} style={btn("ghost")}>Cancel</button>
            <button onClick={()=>{setTriggers(p=>p.map(t=>t.id!==editing.id?t:editing));flash("Template saved");setEditing(null);}} style={btn("primary")}>Save Template</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

