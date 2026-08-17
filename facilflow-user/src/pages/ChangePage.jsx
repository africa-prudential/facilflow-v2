import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Search, Zap, Eye } from "lucide-react";
import { C, btn, inp, sel, card, LBL } from "../theme.js";
import { fmtD } from "../utils.js";
import { Av, EnvTag, RiskTag, PageTitle, TH, Filters } from "../components/ui.jsx";
import CRForm from "./forms/CRForm.jsx";
import CRDetail from "./forms/CRDetail.jsx";

export default function ChangePage({ctx}){
  const {crs,submitCR,advanceCR,users,myChangeRoles,uid,me,hasChangeMgmtAccess,approvalLevels}=ctx;
  const [searchParams, setSearchParams] = useSearchParams();
  const [form,    setForm]    = useState(false);
  const [detail,  setDetail]  = useState(null);

  useEffect(() => {
    if(searchParams.get("new")==="1"){
      setForm(true);
      setSearchParams(p=>{ p.delete("new"); return p; }, {replace:true});
    }
  }, []);

  useEffect(() => {
    const crId = searchParams.get("cr");
    if(crId && crs.length>0){
      const match = crs.find(c=>c.id===crId);
      if(match) setDetail(match);
      setSearchParams(p=>{ p.delete("cr"); return p; }, {replace:true});
    }
  }, [searchParams, crs]);
  const [search,  setSearch]  = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fType,   setFType]   = useState("");
  const [fEnv,    setFEnv]    = useState("");
  const [fRisk,   setFRisk]   = useState("");
  const [fUser,   setFUser]   = useState("");
  const [fFrom,   setFFrom]   = useState("");
  const [fTo,     setFTo]     = useState("");
  const [fOutcome,setFOutcome]= useState("");
  const [page,    setPage]    = useState(1);
  const [activeCard, setActiveCard] = useState("");
  const PAGE_SIZE = 15;

  const isMgr    = (myChangeRoles||[]).includes("change_manager");
  const isApprover = (approvalLevels||[]).some(l=>(myChangeRoles||[]).includes(l.role_key));
  const isImpl   = (myChangeRoles||[]).includes("change_implementer");
  const isRevwr  = (myChangeRoles||[]).includes("change_reviewer");

  const isLineMgr = me.role==="line_manager";

  // Can the CURRENT user actually act on this specific CR right now?
  const canActOnCR = c => {
    if(c.status==="pending_line_manager") return isLineMgr && me.dept===users[c.initiator]?.dept;
    if(c.status==="pending_manager") return isMgr;
    if(c.status==="pending_approval"){
      const lvl = (c.level_approvals||[]).find(l=>c.current_stage===`pending_level_${l.level}`);
      return !!lvl && (myChangeRoles||[]).includes(lvl.role_key);
    }
    if(c.status==="pending_implementation"||c.status==="in_progress") return isImpl;
    return false;
  };

  // Scope: technicians see only their own + involved; others see all
  const scopedCRs = useMemo(()=>{
    if(isMgr||isApprover||isImpl||isLineMgr) return crs||[];
    return (crs||[]).filter(c=>
      c.initiator===uid ||
      (c.reviewer_ids||[]).includes(uid) ||
      c.change_manager_id===uid
    );
  },[crs,uid,isMgr,isApprover,isImpl,isLineMgr]);

  // ── METRICS (on scoped, unfiltered dataset) ─────────────
  const total       = scopedCRs.length;
  const pending     = scopedCRs.filter(c=>["pending_line_manager","pending_manager","pending_approval"].includes(c.status)).length;
  const inImpl      = scopedCRs.filter(c=>["pending_implementation","in_progress"].includes(c.status)).length;
  const completed   = scopedCRs.filter(c=>["completed","closed"].includes(c.status)).length;

  // Avg TAT: days from created_at to last approval or completion
  const tatDays = useMemo(()=>{
    const done = scopedCRs.filter(c=>c.status==="completed"&&c.created_at&&c.implementation_completed_at);
    if(!done.length) return null;
    const avg = done.reduce((sum,c)=>{
      const diff = new Date(c.implementation_completed_at)-new Date(c.created_at);
      return sum + diff/(1000*60*60*24);
    },0)/done.length;
    return avg.toFixed(1);
  },[scopedCRs]);

  // ── FILTER LOGIC ─────────────────────────────────────────
  const filtered = useMemo(()=>{
    const q = search.toLowerCase();
    return scopedCRs.filter(c=>{
      const raiser = users[c.initiator];
      const ct = c.change_type||c.changeType||"";
      const rl = c.risk_level||c.riskLevel||"";
      const st = c.status||"";
      const outcome = c.implementation_outcome||"";

      if(fStatus){
        const statusGroups = {
          pending_manager: ["pending_manager"],
          pending_approval:["pending_approval"],
          implementation:  ["pending_implementation","in_progress"],
          completed:       ["completed","closed"],
          rejected:        ["rejected"],
        };
        const group = statusGroups[fStatus]||[fStatus];
        if(!group.includes(st)) return false;
      }
      if(activeCard==="pending"  && !["pending_line_manager","pending_manager","pending_approval"].includes(st)) return false;
      if(activeCard==="impl"     && !["pending_implementation","in_progress"].includes(st)) return false;
      if(activeCard==="done"     && !["completed","closed"].includes(st)) return false;
      if(activeCard==="rejected" && st!=="rejected") return false;

      if(fType    && ct!==fType)   return false;
      if(fEnv     && c.environment!==fEnv) return false;
      if(fRisk    && rl!==fRisk)   return false;
      if(fUser    && c.initiator!==fUser) return false;
      if(fOutcome && outcome!==fOutcome) return false;
      if(fFrom && new Date(c.created_at)<new Date(fFrom)) return false;
      if(fTo   && new Date(c.created_at)>new Date(fTo+"T23:59:59")) return false;
      if(q){
        const hay=[c.id,c.title||"",c.description||"",raiser?.name||"",c.system_name||""].join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  },[scopedCRs,search,fStatus,fType,fEnv,fRisk,fUser,fOutcome,fFrom,fTo,activeCard,users]);

  const totalPages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const resetPage = fn => (...args) => { fn(...args); setPage(1); };
  const hasFilters = search||fStatus||fType||fEnv||fRisk||fUser||fOutcome||fFrom||fTo||activeCard;

  const clearAll = ()=>{
    setSearch(""); setFStatus(""); setFType(""); setFEnv(""); setFRisk("");
    setFUser(""); setFOutcome(""); setFFrom(""); setFTo(""); setActiveCard(""); setPage(1);
  };

  const stageLabel = c=>{
    if(c.status==="pending_manager")        return {label:"Awaiting Manager",    color:C.amber};
    if(c.status==="pending_approval")       return {label:`Level ${c.current_level||1} Approval`, color:C.violet};
    if(c.status==="pending_implementation") return {label:"Ready to Implement",  color:C.blue};
    if(c.status==="in_progress")            return {label:"Implementing",         color:C.teal};
    if(c.status==="completed")              return {label:"Completed",            color:C.green};
    if(c.status==="closed")                 return {label:"Closed",               color:C.muted};
    if(c.status==="rejected")               return {label:"Rejected",             color:C.red};
    return {label:c.status.replace(/_/g," "), color:C.muted};
  };

  const uniqueUsers = Object.values(users||{}).filter(Boolean);

  // CSV export
  const exportCSV = ()=>{
    const headers = ["CR ID","Title","Type","Environment","Risk","Raised By","Date Raised","Last Updated","Status","Outcome"];
    const rows = filtered.map(c=>{
      const raiser = users[c.initiator];
      return [c.id, c.title||"", c.change_type||c.changeType||"", c.environment||"",
        c.risk_level||c.riskLevel||"", raiser?.name||"",
        c.created_at?new Date(c.created_at).toLocaleDateString("en-GB"):"",
        c.updated_at?new Date(c.updated_at).toLocaleDateString("en-GB"):"",
        c.status.replace(/_/g," "), c.implementation_outcome||""];
    });
    const csv=[headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`change-requests-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <PageTitle title="Change Requests" sub="Enterprise change management and governance"
        action={hasChangeMgmtAccess&&<button onClick={()=>setForm(true)} style={btn("primary")}>+ Raise Change Request</button>}/>

      {/* ── 5 METRIC CARDS ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        {[
          {key:"",         label:"Total Changes",       value:total,    sub:"All in scope",              color:C.blue},
          {key:"pending",  label:"Pending Approvals",   value:pending,  sub:"Awaiting sign-off",         color:C.amber},
          {key:"tat",      label:"Avg TAT (days)",      value:tatDays??"-", sub:"Submission to close",   color:C.violet},
          {key:"impl",     label:"In Implementation",   value:inImpl,   sub:"Being executed",            color:C.teal},
          {key:"done",     label:"Completed",           value:completed,sub:"Successfully closed",       color:C.green},
        ].map(({key,label,value,sub,color})=>{
          const active = activeCard===key && key!=="tat";
          return (
            <div key={label} onClick={()=>{ if(key==="tat") return; resetPage(setActiveCard)(active?"":key); }}
              style={{background:"#fff",border:`1.5px solid ${active?color:C.border}`,borderRadius:10,padding:"14px 16px",
                cursor:key==="tat"?"default":"pointer",
                boxShadow:active?`0 0 0 3px ${color}18`:"none",transition:"all .15s"}}>
              <div style={{fontSize:26,fontWeight:800,color:active?color:C.ink,letterSpacing:"-.03em",lineHeight:1}}>{value}</div>
              <div style={{fontSize:12,fontWeight:700,color:active?color:C.ink,marginTop:6}}>{label}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── FILTER PANEL ── */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:700,color:C.ink}}>Filters</span>
          {hasFilters&&<button onClick={clearAll} style={{...btn("ghost"),fontSize:11,padding:"3px 10px",color:C.red}}><X size={12}/> Clear all</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          <div>
            <label style={LBL}>Status / Stage</label>
            <select value={fStatus} onChange={e=>resetPage(setFStatus)(e.target.value)} style={sel()}>
              <option value="">All Statuses</option>
              <option value="pending_line_manager">Pending Line Manager</option>
              <option value="pending_manager">Pending Manager</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="implementation">Implementation</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={LBL}>Change Type</label>
            <select value={fType} onChange={e=>resetPage(setFType)(e.target.value)} style={sel()}>
              <option value="">All Types</option>
              {["Standard","Normal","Emergency"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Environment</label>
            <select value={fEnv} onChange={e=>resetPage(setFEnv)(e.target.value)} style={sel()}>
              <option value="">All Environments</option>
              {["Dev","Staging","Production"].map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Risk Level</label>
            <select value={fRisk} onChange={e=>resetPage(setFRisk)(e.target.value)} style={sel()}>
              <option value="">All Risk Levels</option>
              {["Low","Medium","High"].map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Requester</label>
            <select value={fUser} onChange={e=>resetPage(setFUser)(e.target.value)} style={sel()}>
              <option value="">All Requesters</option>
              {uniqueUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Outcome</label>
            <select value={fOutcome} onChange={e=>resetPage(setFOutcome)(e.target.value)} style={sel()}>
              <option value="">Any Outcome</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label style={LBL}>Date From</label>
            <input type="date" value={fFrom} onChange={e=>resetPage(setFFrom)(e.target.value)} style={inp()}/>
          </div>
          <div>
            <label style={LBL}>Date To</label>
            <input type="date" value={fTo} onChange={e=>resetPage(setFTo)(e.target.value)} style={inp()}/>
          </div>
        </div>
      </div>

      {/* ── SEARCH + EXPORT ── */}
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,display:"flex"}}><Search size={14}/></span>
          <input value={search} onChange={e=>resetPage(setSearch)(e.target.value)}
            placeholder="Search by CR code, title, requester, system, description keywords…"
            style={{...inp(),paddingLeft:32,width:"100%"}}/>
        </div>
        <div style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{filtered.length} result{filtered.length!==1?"s":""}</div>
        <button onClick={exportCSV} style={{...btn("ghost"),fontSize:12,padding:"7px 14px",whiteSpace:"nowrap"}}>⬇ Export CSV</button>
      </div>

      {/* ── TABLE ── */}
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["CR ID","Title","Type","Environment","Risk","Raised By","Date Raised","Last Updated","Stage","Action"]}/>
          <tbody>
            {paged.length===0&&(
              <tr><td colSpan={10} style={{padding:"48px",textAlign:"center",color:C.muted,fontSize:13}}>
                {hasFilters?"No change requests match your filters.":hasChangeMgmtAccess?"No change requests yet — click '+ Raise Change Request' to create one.":"Nothing to show."}
              </td></tr>
            )}
            {paged.map((c,i)=>{
              const raiser = users[c.initiator];
              const sl     = stageLabel(c);
              const ct     = c.change_type||c.changeType||"—";
              const rl     = c.risk_level||c.riskLevel||"—";
              return (
                <tr key={c.id} onClick={()=>setDetail(c)}
                  style={{borderBottom:i<paged.length-1?`1px solid #F1F5F9`:"none",cursor:"pointer"}}>
                  <td style={{padding:"11px 14px",fontSize:11,fontWeight:700,color:C.ink,whiteSpace:"nowrap"}}>
                    {c.is_emergency&&<span style={{color:C.red,marginRight:4,display:"inline-flex",verticalAlign:"middle"}}><Zap size={12}/></span>}
                    {c.id}
                    {c.version>1&&<span style={{fontSize:9,color:C.muted,marginLeft:4,fontWeight:400}}>v{c.version}</span>}
                  </td>
                  <td style={{padding:"11px 14px",maxWidth:200}}>
                    <div style={{fontSize:13,color:C.ink,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                    {c.system_name&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{c.system_name}</div>}
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted}}>{ct}</td>
                  <td style={{padding:"11px 14px"}}><EnvTag e={c.environment}/></td>
                  <td style={{padding:"11px 14px"}}><RiskTag r={rl}/></td>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <Av i={raiser?.initials||"?"} s={24}/>
                      <span style={{fontSize:12,color:C.ink}}>{raiser?.name||"—"}</span>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(c.created_at)}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(c.updated_at)}</td>
                  <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:sl.color+"18",color:sl.color}}>{sl.label}</span>
                  </td>
                  <td style={{padding:"11px 14px"}}>
                    <button onClick={e=>{e.stopPropagation();setDetail(c);}}
                      style={{...btn(canActOnCR(c)?"primary":"ghost"),fontSize:11,padding:"4px 12px",display:"inline-flex",alignItems:"center",gap:5}}>
                      {canActOnCR(c)?<>Action →</>:<><Eye size={12}/> View</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── PAGINATION ── */}
        <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:C.muted}}>
            {filtered.length===0?"0 results":`${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} of ${filtered.length}`}
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>setPage(1)} disabled={page===1} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>«</button>
            <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===1?.4:1}}>‹</button>
            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
              const pg=Math.max(1,Math.min(page-2,totalPages-4))+i;
              if(pg<1||pg>totalPages) return null;
              return <button key={pg} onClick={()=>setPage(pg)} style={{...btn(pg===page?"primary":"ghost"),padding:"4px 10px",fontSize:12,minWidth:32}}>{pg}</button>;
            })}
            <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>›</button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{...btn("ghost"),padding:"4px 8px",fontSize:12,opacity:page===totalPages?.4:1}}>»</button>
          </div>
        </div>
      </div>

      {form&&<CRForm onClose={()=>setForm(false)} onSubmit={submitCR} ctx={ctx}/>}
      {detail&&<CRDetail cr={detail} onClose={()=>setDetail(null)} ctx={ctx} onAction={advanceCR}/>}
    </div>
  );
}
