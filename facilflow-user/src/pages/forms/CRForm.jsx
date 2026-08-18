import { useState } from "react";
import { Check, Zap, Paperclip, FileText, X, ClipboardList, ExternalLink } from "lucide-react";
import { C, btn, inp, sel, LBL } from "../../theme.js";
import { Av, Modal } from "../../components/ui.jsx";
import RichTextEditor, { isEmptyHtml } from "../../components/RichTextEditor.jsx";
import RichTextView from "../../components/RichTextView.jsx";
import { CR_CATEGORIES, CR_MODULES, DOC_LABELS } from "../../constants.js";
import { uploadCRAttachment } from "../../lib/supabase.js";

const DOC_RULES = {
  "New Feature": { mandatory: ["uat_signoff","test_scripts"], oneOf: [] },
  "Enhancement": { mandatory: [], oneOf: ["uat_signoff","user_concurrence"] },
  "Fix":         { mandatory: [], oneOf: [] },
};
const DOC_TYPES = ["uat_signoff","test_scripts","user_concurrence","other"];

export default function CRForm({onClose,onSubmit,ctx}){
  const {crUsers,myChangeRoles} = ctx||{};
  const reviewers = (crUsers||{})["change_reviewer"]||[];

  const [draftId]     = useState(()=>`draft-${crypto.randomUUID?.() || Date.now()}`);
  const [step,        setStep]       = useState(1);
  const [title,       setTitle]      = useState("");
  const [desc,        setDesc]       = useState("");
  const [module,      setModule]     = useState("Greenpole");
  const [systemOther, setSystemOther]= useState("");
  const [environment, setEnv]        = useState("Staging");
  const [deployDate,  setDeployDate] = useState("");
  const [deployStart, setDStart]     = useState("22:00");
  const [deployEnd,   setDEnd]       = useState("02:00");
  const [changeType,  setCType]      = useState("Normal");
  const [riskLevel,   setRisk]       = useState("Medium");
  const [category,    setCat]        = useState("New Feature");
  const [rollback,    setRollback]   = useState("");
  const [docs,        setDocs]       = useState({uat_signoff:[],test_scripts:[],user_concurrence:[],other:[]});
  const [uploading,   setUploading]  = useState({});
  const [reviewerIds, setReviewers]  = useState([]);
  const [errs,        setErrs]       = useState({});

  const rules = DOC_RULES[category] || {mandatory:[],oneOf:[]};

  const validate1 = () => {
    const er = {};
    if(!title)      er.title      = "Required";
    if(isEmptyHtml(desc)) er.desc = "Required";
    if(module==="Other" && !systemOther) er.systemOther = "Required";
    if(!deployDate) er.deployDate = "Required";
    setErrs(er); return Object.keys(er).length===0;
  };
  const validate2 = () => {
    const er = {};
    if(isEmptyHtml(rollback)) er.rollback = "Required";
    rules.mandatory.forEach(dt=>{ if((docs[dt]||[]).length===0) er[dt]="Required"; });
    if(rules.oneOf.length>0 && !rules.oneOf.some(dt=>(docs[dt]||[]).length>0)){
      er.oneOf = `At least one of ${rules.oneOf.map(dt=>DOC_LABELS[dt]).join(" or ")} is required`;
    }
    setErrs(er); return Object.keys(er).length===0;
  };

  const toggleReviewer = (id) => setReviewers(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const handleDocFiles = async (docType, e) => {
    const files = Array.from(e.target.files||[]);
    if(!files.length) return;
    setUploading(p=>({...p,[docType]:true}));
    try {
      const uploaded = await Promise.all(files.map(f=>uploadCRAttachment(draftId,docType,f)));
      setDocs(p=>({...p,[docType]:[...p[docType],...uploaded]}));
      setErrs(p=>{ const n={...p}; delete n[docType]; delete n.oneOf; return n; });
    } catch(err){
      setErrs(p=>({...p,[docType]:`Upload failed: ${err.message}`}));
    } finally {
      setUploading(p=>({...p,[docType]:false}));
      e.target.value = "";
    }
  };
  const removeDoc = (docType, path) => setDocs(p=>({...p,[docType]:p[docType].filter(f=>f.path!==path)}));

  const handleSubmit = () => {
    const systemName = module==="Other" ? systemOther : module;
    const attachments = Object.values(docs).flat();
    onSubmit({title,desc,system:systemName,environment,deployDate,deployStart,deployEnd,
      changeType,riskLevel,category,rollback,attachments,reviewerIds});
    onClose();
  };

  const STEPS = ["Request Details","Risk & Documents","Review & Submit"];
  const approvalRoute = changeType==="Emergency"
    ? "Emergency → Change Manager → Level 1 → Implementer"
    : "Draft → Change Manager → Level 1 → Level 2 → Implementer";

  return (
    <Modal title="Raise Change Request" sub={`Step ${step} of 3 — ${STEPS[step-1]}`} onClose={onClose} w={720}>
      {/* Progress */}
      <div style={{display:"flex",gap:0,marginBottom:22}}>
        {STEPS.map((sl,i)=>(
          <div key={i} style={{flex:1,display:"flex",alignItems:"center",flexDirection:"column",gap:5}}>
            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:700,
              background:step>i+1?C.green:step===i+1?C.brand:C.border,
              color:step>=i+1?"#fff":C.muted}}>
              {step>i+1?<Check size={14}/>:i+1}
            </div>
            <div style={{fontSize:10,fontWeight:600,color:step===i+1?C.ink:C.muted,textAlign:"center"}}>{sl}</div>
          </div>
        ))}
      </div>

      {step===1&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{gridColumn:"1/-1"}}>
            <label style={LBL}>Change Title{errs.title&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.title}</span>}</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Azure API Gateway v2 Upgrade" style={inp(!!errs.title)}/>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={LBL}>Change Type</label>
            <div style={{display:"flex",gap:10}}>
              {[{v:"Standard",icon:"⬡",desc:"Pre-approved, low risk"},{v:"Normal",icon:"◈",desc:"Full approval workflow"},{v:"Emergency",icon:<Zap size={16}/>,desc:"Bypass L2 — senior only"}].map(t=>{
                const active=changeType===t.v;
                const tc={Standard:C.blue,Normal:C.violet,Emergency:C.red}[t.v];
                return <button key={t.v} onClick={()=>setCType(t.v)} style={{flex:1,padding:"10px 8px",border:`1.5px solid ${active?tc:C.border}`,borderRadius:8,background:active?tc+"0D":"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                  <div style={{fontSize:16,marginBottom:2}}>{t.icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color:active?tc:C.ink2}}>{t.v}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:1}}>{t.desc}</div>
                </button>;
              })}
            </div>
          </div>
          <div>
            <label style={LBL}>Environment</label>
            <select value={environment} onChange={e=>setEnv(e.target.value)} style={sel()}>
              {["Dev","Staging","Production"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Risk Level</label>
            <select value={riskLevel} onChange={e=>setRisk(e.target.value)} style={sel()}>
              {["Low","Medium","High"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Category</label>
            <select value={category} onChange={e=>setCat(e.target.value)} style={sel()}>
              {CR_CATEGORIES.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Module / System</label>
            <select value={module} onChange={e=>setModule(e.target.value)} style={sel()}>
              {CR_MODULES.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {module==="Other"&&(
            <div style={{gridColumn:"1/-1"}}>
              <label style={LBL}>Specify Module/System{errs.systemOther&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.systemOther}</span>}</label>
              <input value={systemOther} onChange={e=>setSystemOther(e.target.value)} placeholder="e.g. Azure API Gateway" style={inp(!!errs.systemOther)}/>
            </div>
          )}
          <div style={{gridColumn:"1/-1"}}>
            <label style={LBL}>Description{errs.desc&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.desc}</span>}</label>
            <RichTextEditor value={desc} onChange={setDesc} placeholder="What will be changed and why…" error={!!errs.desc}/>
          </div>
          <div>
            <label style={LBL}>Deployment Date{errs.deployDate&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.deployDate}</span>}</label>
            <input type="date" value={deployDate} onChange={e=>setDeployDate(e.target.value)} style={inp(!!errs.deployDate)}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}><label style={LBL}>Start Time</label><input type="time" value={deployStart} onChange={e=>setDStart(e.target.value)} style={inp()}/></div>
            <div style={{flex:1}}><label style={LBL}>End Time</label><input type="time" value={deployEnd} onChange={e=>setDEnd(e.target.value)} style={inp()}/></div>
          </div>

          {/* Reviewers — optional */}
          {reviewers.length>0&&(
            <div style={{gridColumn:"1/-1"}}>
              <label style={LBL}>Change Reviewers (optional) — advisory only</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                {reviewers.map(r=>{
                  const sel = reviewerIds.includes(r.id);
                  return (
                    <button key={r.id} onClick={()=>toggleReviewer(r.id)} style={{
                      display:"flex",alignItems:"center",gap:7,padding:"6px 12px",
                      border:`1.5px solid ${sel?C.green:C.border}`,borderRadius:8,
                      background:sel?C.greenBg:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                      <Av i={r.initials||"?"} s={22} bg={sel?C.green:C.muted}/>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontSize:12,fontWeight:600,color:sel?C.green:C.ink}}>{r.name}</div>
                        <div style={{fontSize:10,color:C.muted}}>{r.dept}</div>
                      </div>
                      {sel&&<span style={{color:C.green,marginLeft:2,display:"inline-flex"}}><Check size={11}/></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {step===2&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{padding:"11px 14px",borderRadius:7,fontSize:12,fontWeight:600,
            background:riskLevel==="High"?C.redBg:riskLevel==="Medium"?C.amberBg:C.greenBg,
            color:riskLevel==="High"?C.red:riskLevel==="Medium"?C.amber:C.green}}>
            {riskLevel} Risk — Route: {approvalRoute}
          </div>
          <div>
            <label style={LBL}>Rollback Plan{errs.rollback&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.rollback}</span>}</label>
            <RichTextEditor value={rollback} onChange={setRollback} placeholder="Step-by-step instructions to revert if something goes wrong…" error={!!errs.rollback} minHeight={90}/>
          </div>

          {errs.oneOf&&<div style={{padding:"9px 13px",borderRadius:7,background:C.redBg,border:`1px solid ${C.red}30`,fontSize:12,color:C.red,fontWeight:500}}>{errs.oneOf}</div>}

          {DOC_TYPES.map(dt=>{
            const isMandatory = rules.mandatory.includes(dt);
            const isOneOf     = rules.oneOf.includes(dt);
            const badge = isMandatory ? {label:"Required",color:C.red,bg:C.redBg}
              : isOneOf ? {label:"Required (one of)",color:C.amber,bg:C.amberBg}
              : {label:"Optional",color:C.muted,bg:"#F1F5F9"};
            return (
              <div key={dt}>
                <label style={LBL}>
                  {DOC_LABELS[dt]}
                  <span style={{marginLeft:8,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10,color:badge.color,background:badge.bg,textTransform:"uppercase",letterSpacing:".04em"}}>{badge.label}</span>
                  {errs[dt]&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs[dt]}</span>}
                </label>
                <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",border:`2px dashed ${C.border}`,borderRadius:8,cursor:"pointer",background:"#FAFAFA",color:C.muted,fontSize:12}}>
                  <Paperclip size={18}/>
                  <div><div style={{fontWeight:600,color:C.ink}}>{uploading[dt]?"Uploading…":"Click to attach files"}</div><div style={{fontSize:11,marginTop:2}}>PDF, Word, Excel, images</div></div>
                  <input type="file" multiple disabled={!!uploading[dt]} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt" onChange={e=>handleDocFiles(dt,e)} style={{display:"none"}}/>
                </label>
                {docs[dt].length>0&&<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
                  {docs[dt].map((f,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:"#F8FAFC",borderRadius:6,border:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}><FileText size={16}/><div><div style={{fontSize:12,fontWeight:600,color:C.ink}}>{f.name}</div><div style={{fontSize:10,color:C.muted}}>{(f.size/1024).toFixed(1)} KB</div></div></div>
                      <button onClick={()=>removeDoc(dt,f.path)} style={{...btn("ghost"),padding:"3px 7px",fontSize:11,color:C.red}}><X size={12}/></button>
                    </div>
                  ))}
                </div>}
              </div>
            );
          })}
        </div>
      )}

      {step===3&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:C.pageBg,borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:12}}>Review Summary</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Title",title],["Module",module==="Other"?`Other: ${systemOther}`:module],["Environment",environment],["Type",changeType],["Risk",riskLevel],["Category",category],["Deploy Date",deployDate],["Time Window",`${deployStart} – ${deployEnd}`]].map(([k,v])=>(
                <div key={k} style={{background:"#fff",padding:"8px 11px",borderRadius:6,border:`1px solid ${C.border}`,gridColumn:k==="Title"?"1/-1":"auto"}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>{k}</div>
                  <div style={{fontSize:12,fontWeight:600,color:C.ink,marginTop:2}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Description</div>
            {isEmptyHtml(desc) ? <div style={{fontSize:13,color:C.ink}}>—</div> : <RichTextView value={desc}/>}
          </div>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Rollback Plan</div>
            {isEmptyHtml(rollback) ? <div style={{fontSize:13,color:C.ink}}>—</div> : <RichTextView value={rollback}/>}
          </div>
          {DOC_TYPES.some(dt=>docs[dt].length>0)&&<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Supporting Documents</div>
            {DOC_TYPES.filter(dt=>docs[dt].length>0).map(dt=>(
              <div key={dt} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:C.ink2,marginBottom:3}}>{DOC_LABELS[dt]}</div>
                {docs[dt].map((f,i)=>(
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.blue,padding:"2px 0",textDecoration:"none"}}>
                    <Paperclip size={12}/>{f.name}<span style={{color:C.muted}}>({(f.size/1024).toFixed(1)} KB)</span><ExternalLink size={11}/>
                  </a>
                ))}
              </div>
            ))}
          </div>}
          {reviewerIds.length>0&&<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Reviewers Selected</div>
            {reviewerIds.map(id=>{const r=reviewers.find(x=>x.id===id);return r?<div key={id} style={{fontSize:12,color:C.ink,padding:"2px 0"}}>{r.name}</div>:null;})}
          </div>}
          <div style={{padding:"12px 14px",borderRadius:8,fontSize:12,background:C.violetBg,border:`1px solid ${C.violet}22`,color:C.violet,fontWeight:600,lineHeight:1.7}}>
            <div style={{marginBottom:4,display:"flex",alignItems:"center",gap:6}}><ClipboardList size={14}/> Approval Route</div>
            <div style={{fontWeight:500}}>{approvalRoute}</div>
          </div>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={step>1?()=>setStep(p=>p-1):onClose} style={btn("ghost")}>{step>1?"← Back":"Cancel"}</button>
        {step<3
          ?<button onClick={()=>{if(step===1&&!validate1())return;if(step===2&&!validate2())return;setErrs({});setStep(p=>p+1)}} style={btn("primary")}>Next →</button>
          :<button onClick={handleSubmit} style={btn("primary")}>Submit CR <Check size={14}/></button>}
      </div>
    </Modal>
  );
}
