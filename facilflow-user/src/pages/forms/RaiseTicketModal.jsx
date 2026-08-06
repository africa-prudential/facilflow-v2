import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { C, btn, inp, card, LBL } from "../../theme.js";

export default function RaiseTicketModal({cats,ticketCats,me,crs,uploadAttachment,onClose,onCreate}){
  const [step,setStep]=useState("form"); // "form" | "preview"
  const [form,setForm]=useState({
    type:"service_request", ticket_type:"", priority:"medium", priority_auto:true,
    urgency:"medium", impact:"medium", severity:"moderate",
    category:"", subcategory:"", item:"",
    subject:"", description:"", impact_details:"",
    department:me?.dept||me?.department||"", site:"",
    product_service:"", asset_free_text:"", linked_cr_id:"", mode:"portal",
  });
  const [files,setFiles]=useState([]);       // File objects
  const [previews,setPreviews]=useState([]);  // {name,size,type,dataUrl?}
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const isInc=form.type==="incident";

  const subcats=[...new Set((ticketCats||[]).filter(c=>c.category===form.category).map(c=>c.subcategory).filter(Boolean))];
  const items=[...new Set((ticketCats||[]).filter(c=>c.category===form.category&&c.subcategory===form.subcategory).map(c=>c.item).filter(Boolean))];

  const fmtBytes=b=>b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`;

  const handleFiles=(e)=>{
    const chosen=Array.from(e.target.files||[]);
    chosen.forEach(f=>{
      setFiles(p=>[...p,f]);
      if(f.type.startsWith("image/")){
        const r=new FileReader();
        r.onload=ev=>setPreviews(p=>[...p,{name:f.name,size:f.size,type:f.type,dataUrl:ev.target.result}]);
        r.readAsDataURL(f);
      } else {
        setPreviews(p=>[...p,{name:f.name,size:f.size,type:f.type}]);
      }
    });
    e.target.value="";
  };

  const removeFile=(i)=>{ setFiles(p=>p.filter((_,j)=>j!==i)); setPreviews(p=>p.filter((_,j)=>j!==i)); };

  const goPreview=(e)=>{ e.preventDefault(); if(!form.subject.trim()){setErr("Subject is required");return;} setErr(""); setStep("preview"); };

  const handleSubmit=async()=>{
    setSaving(true); setErr("");
    try{
      const ticketId=`TKT-${Date.now().toString(36).toUpperCase()}`;
      const attachments=[];
      for(const f of files){
        try{ attachments.push(await uploadAttachment(ticketId,f)); }
        catch(e){ console.warn("Attach upload failed:",e.message); }
      }
      await onCreate({...form, id:ticketId, attachments, linked_cr_id:form.linked_cr_id||null});
    }catch(e){ setErr(e.message); setSaving(false); }
  };

  const SH=({t})=>(
    <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".1em",
      borderBottom:`1px solid ${C.border}`,paddingBottom:8,marginBottom:2}}>{t}</div>
  );
  const PRow=({label,val})=>val?<div style={{display:"flex",gap:8,fontSize:13}}><span style={{color:C.muted,minWidth:160,flexShrink:0}}>{label}</span><span style={{color:C.ink,fontWeight:500}}>{val}</span></div>:null;

  const PRIO_COL={low:C.green,medium:C.blue,high:C.amber,critical:C.red};
  const IMP_COL={low:C.green,medium:C.blue,high:C.amber,critical:C.red};
  const SEV_COL={minor:C.green,moderate:C.amber,major:C.orange,critical:C.red};

  useEffect(()=>{
    const handler=(e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[onClose]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(3px)"}}>
      <div style={{background:"#fff",borderRadius:12,width:"100%",maxWidth:720,maxHeight:"95vh",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{padding:"15px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.ink}}>{step==="preview"?"Review Your Ticket":"Raise a Ticket"}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:1}}>{step==="preview"?"Check details before submitting":"Complete all relevant fields"}</div>
            </div>
            {/* Step indicator */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8}}>
              {["form","preview"].map((s,i)=>(
                <React.Fragment key={s}>
                  {i>0&&<div style={{width:24,height:1,background:step==="preview"?C.green:C.border}}/>}
                  <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,
                    background:step===s||step==="preview"?C.green:"transparent",
                    color:step===s||step==="preview"?"#fff":C.muted,
                    border:`1.5px solid ${step===s||step==="preview"?C.green:C.border}`}}>{i+1}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{...btn("ghost"),padding:"4px 9px",borderRadius:5}}><X size={14}/></button>
        </div>

        {/* ─── FORM STEP ─── */}
        {step==="form"&&(
          <form onSubmit={goPreview} style={{padding:"18px 24px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:18}}>

            {/* Section 1 — Ticket Type */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <SH t="Ticket Type"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={LBL}>Request Type *</label>
                  <select value={form.type} onChange={e=>set("type",e.target.value)} style={{...inp(),fontSize:13}}>
                    <option value="service_request">Service Request</option>
                    <option value="incident">Incident</option>
                  </select>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{isInc?"Something is broken or disrupted":"You need something set up or changed"}</div>
                </div>
                <div>
                  <label style={LBL}>Area / Ticket Type</label>
                  <select value={form.ticket_type} onChange={e=>set("ticket_type",e.target.value)} style={{...inp(),fontSize:13}}>
                    <option value="">Select area…</option>
                    {["Hardware","Software","Network","Security","Access","Infrastructure","Other"].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {cats.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                  <div>
                    <label style={LBL}>Category</label>
                    <select value={form.category} onChange={e=>{set("category",e.target.value);set("subcategory","");set("item","");}} style={{...inp(),fontSize:13}}>
                      <option value="">Select…</option>
                      {cats.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Subcategory</label>
                    <select value={form.subcategory} onChange={e=>{set("subcategory",e.target.value);set("item","");}} style={{...inp(),fontSize:13}} disabled={!form.category}>
                      <option value="">Select…</option>
                      {subcats.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Item</label>
                    <select value={form.item} onChange={e=>set("item",e.target.value)} style={{...inp(),fontSize:13}} disabled={!form.subcategory||items.length===0}>
                      <option value="">Select…</option>
                      {items.map(i=><option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2 — Subject & Description */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <SH t="Subject & Description"/>
              <div>
                <label style={LBL}>Subject *</label>
                <input value={form.subject} onChange={e=>set("subject",e.target.value)} required
                  placeholder="One-line summary of your issue or request…" style={{...inp(),fontSize:13}}/>
              </div>
              <div>
                <label style={LBL}>Description</label>
                <textarea value={form.description} onChange={e=>set("description",e.target.value)}
                  placeholder="Describe what happened, what you expected, steps to reproduce, any error messages…"
                  style={{...inp(),resize:"vertical",minHeight:88,fontSize:13,lineHeight:1.6}}/>
              </div>
            </div>

            {/* Section 3 — Priority & Impact */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <SH t="Priority & Impact"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div>
                  <label style={LBL}>Priority</label>
                  <select value={form.priority} onChange={e=>{set("priority",e.target.value);set("priority_auto",false);}} style={{...inp(),fontSize:13}}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>Urgency</label>
                  <select value={form.urgency} onChange={e=>set("urgency",e.target.value)} style={{...inp(),fontSize:13}}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>Impact Level</label>
                  <select value={form.impact} onChange={e=>set("impact",e.target.value)} style={{...inp(),fontSize:13}}>
                    <option value="low">Low — Affects me only</option>
                    <option value="medium">Medium — My team</option>
                    <option value="high">High — Department</option>
                    <option value="critical">Critical — Company-wide</option>
                  </select>
                </div>
              </div>
              {isInc&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <label style={LBL}>Severity</label>
                    <select value={form.severity} onChange={e=>set("severity",e.target.value)} style={{...inp(),fontSize:13}}>
                      <option value="minor">Minor — Minor disruption</option>
                      <option value="moderate">Moderate — Significant impact</option>
                      <option value="major">Major — Core service down</option>
                      <option value="critical">Critical — Complete outage</option>
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Mode of Report</label>
                    <select value={form.mode} onChange={e=>set("mode",e.target.value)} style={{...inp(),fontSize:13}}>
                      <option value="portal">Portal</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="walk-in">Walk-in</option>
                    </select>
                  </div>
                </div>
              )}
              {isInc&&(
                <div>
                  <label style={LBL}>Impact Details</label>
                  <textarea value={form.impact_details} onChange={e=>set("impact_details",e.target.value)}
                    placeholder="How many users/systems affected? What business process is blocked? Is there a workaround?"
                    style={{...inp(),resize:"vertical",minHeight:70,fontSize:13,lineHeight:1.6}}/>
                </div>
              )}
            </div>

            {/* Section 4 — Additional Details */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <SH t="Additional Details"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={LBL}>Your Department</label>
                  <input value={form.department} onChange={e=>set("department",e.target.value)} placeholder="e.g. Finance, IT, HR…" style={{...inp(),fontSize:13}}/>
                </div>
                <div>
                  <label style={LBL}>Site / Location</label>
                  <input value={form.site} onChange={e=>set("site",e.target.value)} placeholder="e.g. Lagos HQ, Abuja Office…" style={{...inp(),fontSize:13}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={LBL}>Affected Product / Service</label>
                  <input value={form.product_service} onChange={e=>set("product_service",e.target.value)} placeholder="e.g. Microsoft 365, ERP, VPN…" style={{...inp(),fontSize:13}}/>
                </div>
                <div>
                  <label style={LBL}>Asset / Device</label>
                  <input value={form.asset_free_text} onChange={e=>set("asset_free_text",e.target.value)} placeholder="e.g. Dell Laptop SN12345…" style={{...inp(),fontSize:13}}/>
                </div>
              </div>
              {(crs||[]).length>0&&(
                <div>
                  <label style={LBL}>Linked Change Request (optional)</label>
                  <select value={form.linked_cr_id} onChange={e=>set("linked_cr_id",e.target.value)} style={{...inp(),fontSize:13}}>
                    <option value="">None</option>
                    {crs.map(cr=><option key={cr.id} value={cr.id}>{cr.id} — {cr.title||cr.subject||""}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Section 5 — Attachments */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <SH t="Attachments"/>
              <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:8,padding:"20px 16px",border:`2px dashed ${C.border}`,borderRadius:8,cursor:"pointer",
                background:"#FAFAFA",transition:"border-color .15s"}}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=C.brand;}}
                onDragLeave={e=>{e.currentTarget.style.borderColor=C.border;}}
                onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=C.border;
                  const dt=e.dataTransfer;const inp_={target:{files:dt.files}};handleFiles(inp_);}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{fontSize:13,color:C.ink,fontWeight:600}}>Click to attach or drag & drop</div>
                <div style={{fontSize:11,color:C.muted}}>Screenshots, documents, logs — any file type · Max 10MB each</div>
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.log,.zip" onChange={handleFiles} style={{display:"none"}}/>
              </label>
              {previews.length>0&&(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {previews.map((p,i)=>(
                    <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,background:"#F8FAFC"}}>
                      {p.dataUrl
                        ?<img src={p.dataUrl} alt={p.name} style={{width:80,height:80,objectFit:"cover",display:"block"}}/>
                        :<div style={{width:80,height:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:6}}>
                           <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.muted} strokeWidth="1.4"/><polyline points="14,2 14,8 20,8" stroke={C.muted} strokeWidth="1.4"/></svg>
                           <div style={{fontSize:9,color:C.muted,textAlign:"center",wordBreak:"break-all",lineHeight:1.2}}>{p.name.slice(0,12)}{p.name.length>12?"…":""}</div>
                           <div style={{fontSize:9,color:C.faint}}>{fmtBytes(p.size)}</div>
                         </div>
                      }
                      <button type="button" onClick={()=>removeFile(i)}
                        style={{position:"absolute",top:3,right:3,width:18,height:18,borderRadius:"50%",
                          background:"rgba(0,0,0,.55)",border:"none",color:"#fff",fontSize:10,cursor:"pointer",
                          display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}><X size={10}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {err&&<div style={{padding:"9px 12px",borderRadius:7,background:C.redBg,border:`1px solid ${C.red}30`,fontSize:13,color:C.red}}>{err}</div>}

            <div style={{display:"flex",justifyContent:"flex-end",gap:10,paddingTop:8,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
              <button type="button" onClick={onClose} style={{...btn("ghost")}}>Cancel</button>
              <button type="submit" style={{...btn("primary"),padding:"8px 20px"}}>Preview & Review →</button>
            </div>
          </form>
        )}

        {/* ─── PREVIEW STEP ─── */}
        {step==="preview"&&(
          <div style={{padding:"18px 24px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>

            {/* Type + Subject header */}
            <div style={{...card(16),borderLeft:`4px solid ${isInc?C.red:C.blue}`}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:4,
                  background:isInc?C.redBg:C.blueBg,color:isInc?C.red:C.blue}}>
                  {isInc?"Incident":"Service Request"}
                </span>
                {form.ticket_type&&<span style={{fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:4,background:C.surface,color:C.ink2}}>{form.ticket_type}</span>}
                <span style={{fontSize:11,padding:"2px 10px",borderRadius:4,fontWeight:600,
                  background:PRIO_COL[form.priority]+"18",color:PRIO_COL[form.priority]}}>
                  {form.priority} priority
                </span>
              </div>
              <div style={{fontSize:17,fontWeight:800,color:C.ink,letterSpacing:"-.02em"}}>{form.subject}</div>
              {[form.category,form.subcategory,form.item].filter(Boolean).length>0&&(
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>
                  {[form.category,form.subcategory,form.item].filter(Boolean).join(" › ")}
                </div>
              )}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* Left: classification */}
              <div style={{...card(14),display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Classification</div>
                <PRow label="Urgency" val={form.urgency}/>
                <PRow label="Impact Level" val={form.impact}/>
                {isInc&&<PRow label="Severity" val={form.severity}/>}
                {isInc&&form.mode&&<PRow label="Mode" val={form.mode}/>}
              </div>
              {/* Right: context */}
              <div style={{...card(14),display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Context</div>
                <PRow label="Department" val={form.department}/>
                <PRow label="Site / Location" val={form.site}/>
                <PRow label="Product / Service" val={form.product_service}/>
                <PRow label="Asset / Device" val={form.asset_free_text}/>
                {form.linked_cr_id&&<PRow label="Linked CR" val={form.linked_cr_id}/>}
              </div>
            </div>

            {form.description&&(
              <div style={card(14)}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Description</div>
                <p style={{fontSize:13,color:C.ink,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{form.description}</p>
              </div>
            )}

            {isInc&&form.impact_details&&(
              <div style={{...card(14),borderLeft:`3px solid ${C.red}`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Impact Details</div>
                <p style={{fontSize:13,color:C.ink,lineHeight:1.65,margin:0,whiteSpace:"pre-wrap"}}>{form.impact_details}</p>
              </div>
            )}

            {previews.length>0&&(
              <div style={card(14)}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Attachments ({previews.length})</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {previews.map((p,i)=>(
                    <div key={i} style={{borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,background:"#F8FAFC"}}>
                      {p.dataUrl
                        ?<img src={p.dataUrl} alt={p.name} style={{width:80,height:80,objectFit:"cover",display:"block"}}/>
                        :<div style={{width:80,height:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:6}}>
                           <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.muted} strokeWidth="1.4"/><polyline points="14,2 14,8 20,8" stroke={C.muted} strokeWidth="1.4"/></svg>
                           <div style={{fontSize:9,color:C.muted,textAlign:"center",wordBreak:"break-all",lineHeight:1.2}}>{p.name.slice(0,12)}{p.name.length>12?"…":""}</div>
                           <div style={{fontSize:9,color:C.faint}}>{fmtBytes(p.size)}</div>
                         </div>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{padding:"10px 14px",borderRadius:8,background:C.blueBg,border:`1px solid ${C.blue}25`,fontSize:12,color:C.blue,fontWeight:500}}>
              Once submitted, the IT support team will receive your ticket and assign it to an agent. You'll be able to track its status and add comments from My Tickets.
            </div>

            {err&&<div style={{padding:"9px 12px",borderRadius:7,background:C.redBg,border:`1px solid ${C.red}30`,fontSize:13,color:C.red}}>{err}</div>}

            <div style={{display:"flex",justifyContent:"space-between",gap:10,paddingTop:8,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
              <button onClick={()=>setStep("form")} style={{...btn("ghost")}}>← Edit Details</button>
              <button onClick={handleSubmit} disabled={saving} style={{...btn("primary"),padding:"8px 24px"}}>
                {saving?"Submitting…":<><Check size={14}/> Submit Ticket</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

