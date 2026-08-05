import { useState } from "react";
import { Check, Zap, Paperclip, FileText, X, ClipboardList } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { Av, Modal } from "../../components/ui.jsx";

export default function CRForm({onClose,onSubmit,ctx}){
  const {crUsers,myChangeRoles} = ctx||{};
  const reviewers = (crUsers||{})["change_reviewer"]||[];

  const [step,        setStep]       = useState(1);
  const [title,       setTitle]      = useState("");
  const [desc,        setDesc]       = useState("");
  const [system,      setSystem]     = useState("");
  const [environment, setEnv]        = useState("Staging");
  const [deployDate,  setDeployDate] = useState("");
  const [deployStart, setDStart]     = useState("22:00");
  const [deployEnd,   setDEnd]       = useState("02:00");
  const [changeType,  setCType]      = useState("Normal");
  const [riskLevel,   setRisk]       = useState("Medium");
  const [category,    setCat]        = useState("Infrastructure");
  const [rollback,    setRollback]   = useState("");
  const [testEvidence,setTest]       = useState("");
  const [attachments, setAttach]     = useState([]);
  const [reviewerIds, setReviewers]  = useState([]);
  const [errs,        setErrs]       = useState({});

  const validate1 = () => {
    const er = {};
    if(!title)      er.title      = "Required";
    if(!desc)       er.desc       = "Required";
    if(!system)     er.system     = "Required";
    if(!deployDate) er.deployDate = "Required";
    setErrs(er); return Object.keys(er).length===0;
  };
  const validate2 = () => {
    const er = {};
    if(!rollback)     er.rollback     = "Required";
    if(!testEvidence) er.testEvidence = "Required";
    setErrs(er); return Object.keys(er).length===0;
  };

  const toggleReviewer = (id) => setReviewers(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files||[]);
    setAttach(p=>[...p,...files.map(f=>({name:f.name,size:f.size,type:f.type}))]);
  };

  const handleSubmit = () => {
    onSubmit({title,desc,system,environment,deployDate,deployStart,deployEnd,
      changeType,riskLevel,category,rollback,testEvidence,attachments,reviewerIds});
    onClose();
  };

  const STEPS = ["Request Details","Risk & Rollback","Review & Submit"];
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
              {[{v:"Standard",icon:"⬡",desc:"Pre-approved, low risk"},{v:"Normal",icon:"◈",desc:"Full approval workflow"},{v:"Major",icon:"◉",desc:"Full chain + L2 approval"},{v:"Emergency",icon:<Zap size={16}/>,desc:"Bypass L2 — senior only"}].map(t=>{
                const active=changeType===t.v;
                const tc={Standard:C.blue,Normal:C.violet,Major:C.orange,Emergency:C.red}[t.v];
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
            <select value={environment} onChange={e=>setEnv(e.target.value)} style={inp()}>
              {["Dev","Staging","Production"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Risk Level</label>
            <select value={riskLevel} onChange={e=>setRisk(e.target.value)} style={inp()}>
              {["Low","Medium","High"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Category</label>
            <select value={category} onChange={e=>setCat(e.target.value)} style={inp()}>
              {["Infrastructure","Application","Security","Database","Network","Compliance"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>System / Service{errs.system&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.system}</span>}</label>
            <input value={system} onChange={e=>setSystem(e.target.value)} placeholder="e.g. Azure API Gateway" style={inp(!!errs.system)}/>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={LBL}>Description{errs.desc&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.desc}</span>}</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What will be changed and why…" style={{...inp(!!errs.desc),minHeight:80,resize:"vertical"}}/>
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
            <textarea value={rollback} onChange={e=>setRollback(e.target.value)} placeholder="Step-by-step instructions to revert if something goes wrong…" style={{...inp(!!errs.rollback),minHeight:90,resize:"vertical"}}/>
          </div>
          <div>
            <label style={LBL}>Testing Evidence{errs.testEvidence&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.testEvidence}</span>}</label>
            <textarea value={testEvidence} onChange={e=>setTest(e.target.value)} placeholder="UAT results, staging tests, performance benchmarks…" style={{...inp(!!errs.testEvidence),minHeight:90,resize:"vertical"}}/>
          </div>
          <div>
            <label style={LBL}>Attachments (optional)</label>
            <label style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",border:`2px dashed ${C.border}`,borderRadius:8,cursor:"pointer",background:"#FAFAFA",color:C.muted,fontSize:12}}>
              <Paperclip size={20}/>
              <div><div style={{fontWeight:600,color:C.ink}}>Click to attach files</div><div style={{fontSize:11,marginTop:2}}>Plans, diagrams, test evidence, screenshots</div></div>
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt" onChange={handleFiles} style={{display:"none"}}/>
            </label>
            {attachments.length>0&&<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
              {attachments.map((f,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:"#F8FAFC",borderRadius:6,border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><FileText size={16}/><div><div style={{fontSize:12,fontWeight:600,color:C.ink}}>{f.name}</div><div style={{fontSize:10,color:C.muted}}>{(f.size/1024).toFixed(1)} KB</div></div></div>
                  <button onClick={()=>setAttach(p=>p.filter((_,j)=>j!==i))} style={{...btn("ghost"),padding:"3px 7px",fontSize:11,color:C.red}}><X size={12}/></button>
                </div>
              ))}
            </div>}
          </div>
        </div>
      )}

      {step===3&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:C.pageBg,borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:12}}>Review Summary</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Title",title],["System",system],["Environment",environment],["Type",changeType],["Risk",riskLevel],["Category",category],["Deploy Date",deployDate],["Time Window",`${deployStart} – ${deployEnd}`]].map(([k,v])=>(
                <div key={k} style={{background:"#fff",padding:"8px 11px",borderRadius:6,border:`1px solid ${C.border}`,gridColumn:k==="Title"?"1/-1":"auto"}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>{k}</div>
                  <div style={{fontSize:12,fontWeight:600,color:C.ink,marginTop:2}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Description</div>
            <div style={{fontSize:13,color:C.ink,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{desc||"—"}</div>
          </div>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Rollback Plan</div>
            <div style={{fontSize:13,color:C.ink,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{rollback||"—"}</div>
          </div>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Testing Evidence</div>
            <div style={{fontSize:13,color:C.ink,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{testEvidence||"—"}</div>
          </div>
          {attachments.length>0&&<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Attachments ({attachments.length})</div>
            {attachments.map((f,i)=><div key={i} style={{fontSize:12,color:C.ink,padding:"2px 0"}}>{f.name} <span style={{color:C.muted}}>({(f.size/1024).toFixed(1)} KB)</span></div>)}
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

// ── CR Detail Modal — with Stage Tracker ──────────────────────
