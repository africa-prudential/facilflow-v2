import { useEffect } from "react";
import { X, Ban } from "lucide-react";
import { C, btn, inp, sel, card, LBL } from "../theme.js";
import { CR_STATUS, TICKET_STATUS, TICKET_PRIORITY, ASSET_STATUS } from "../constants.js";
import { vsm, dsm, humanize } from "../utils.js";

export const Av = ({i,s=30,bg=C.brand}) => (
  <div style={{width:s,height:s,borderRadius:"50%",background:bg,color:"#fff",display:"flex",
    alignItems:"center",justifyContent:"center",fontSize:s*.33,fontWeight:700,flexShrink:0}}>{i}</div>
);

export const Chip = ({label,color,bg}) => (
  <span style={{display:"inline-flex",padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600,
    background:bg,color,border:`1px solid ${color}22`,whiteSpace:"nowrap"}}>{label}</span>
);

export const CRChip  = ({s}) => { const m=CR_STATUS[s]||{label:humanize(s),color:C.muted,bg:"#F8FAFC"}; return <Chip label={m.label} color={m.color} bg={m.bg}/>; };
export const VChip   = ({s}) => { const m=vsm(s); return <Chip label={m.l} color={m.color} bg={m.bg}/>; };
export const DChip   = ({s}) => { const m=dsm(s); return <Chip label={m.l} color={m.color} bg={m.bg}/>; };
export const UChip   = ({s}) => s==="active"?<Chip label="Active"    color={C.green} bg={C.greenBg}/>:<Chip label="Suspended" color={C.red} bg={C.redBg}/>;
export const EnvTag  = ({e}) => { const m={Production:{c:C.red,bg:C.redBg},Staging:{c:C.amber,bg:C.amberBg},Dev:{c:C.green,bg:C.greenBg}}; const key=humanize(e); const {c,bg}=m[key]||{c:C.muted,bg:"#F8FAFC"}; return <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:4,background:bg,color:c}}>{key}</span>; };
export const RiskTag = ({r}) => { const m={High:{c:C.red,bg:C.redBg},Medium:{c:C.amber,bg:C.amberBg},Low:{c:C.green,bg:C.greenBg}}; const key=humanize(r); const {c,bg}=m[key]||{c:C.muted,bg:"#F8FAFC"}; return <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:4,background:bg,color:c}}>{key}</span>; };


export const TChip = ({s})=>{ const m=TICKET_STATUS[s]||{label:humanize(s),color:C.muted,bg:"#F8FAFC"}; return <Chip label={m.label} color={m.color} bg={m.bg}/>; };
export const PChip = ({p})=>{ const m=TICKET_PRIORITY[p]||{label:humanize(p),color:C.muted,bg:"#F8FAFC"}; return <Chip label={m.label} color={m.color} bg={m.bg}/>; };

export const AChip = ({s})=>{ const m=ASSET_STATUS[s]||{label:humanize(s),color:C.muted,bg:"#F8FAFC"}; return <Chip label={m.label} color={m.color} bg={m.bg}/>; };

export function Modal({title,sub,onClose,children,w=640}){
  useEffect(()=>{
    const handler=(e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[onClose]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(3px)"}}>
      <div style={{...card(0),width:w,maxWidth:"96vw",maxHeight:"92vh",display:"flex",flexDirection:"column",borderRadius:12}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div><div style={{fontSize:15,fontWeight:700,color:C.ink}}>{title}</div>{sub&&<div style={{fontSize:12,color:C.muted,marginTop:1}}>{sub}</div>}</div>
          <button onClick={onClose} style={{...btn("ghost"),padding:"4px 9px",borderRadius:5}}><X size={14}/></button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

export function PageTitle({title,sub,action}){
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
      <div><h1 style={{margin:0,fontSize:20,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>{title}</h1>{sub&&<p style={{margin:"3px 0 0",fontSize:13,color:C.muted}}>{sub}</p>}</div>
      {action}
    </div>
  );
}

export function TH({cols}){
  return <thead><tr style={{background:"#FAFAFA"}}>{cols.map(c=><th key={c} style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{c}</th>)}</tr></thead>;
}

export function Empty({icon="—",title,sub}){
  return <div style={{textAlign:"center",padding:"40px 24px",color:C.muted}}><div style={{fontSize:34,marginBottom:10}}>{icon}</div><div style={{fontWeight:600,color:C.ink2,fontSize:14}}>{title}</div>{sub&&<div style={{fontSize:12,marginTop:4}}>{sub}</div>}</div>;
}

export function AccessDenied(){
  return (
    <div style={{minHeight:"40vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{width:60,height:60,borderRadius:16,background:C.redBg,display:"flex",alignItems:"center",justifyContent:"center"}}><Ban size={26} color={C.red}/></div>
      <div style={{fontSize:16,fontWeight:700,color:C.ink}}>Access Denied</div>
      <div style={{fontSize:13,color:C.muted,textAlign:"center",maxWidth:320}}>You don't have permission to access this module. Contact your Super Admin if you need access.</div>
    </div>
  );
}

export function Filters({fields,values,onChange}){
  return (
    <div style={{display:"flex",gap:10,flexWrap:"wrap",padding:"12px 14px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16,alignItems:"flex-end"}}>
      {fields.map(f=>(
        <div key={f.k} style={{display:"flex",flexDirection:"column",minWidth:f.w||120}}>
          <label style={LBL}>{f.label}</label>
          {f.type==="select"
            ?<select value={values[f.k]||""} onChange={e=>onChange({...values,[f.k]:e.target.value})} style={{...sel(),padding:"6px 9px",fontSize:12}}>
               <option value="">All</option>
               {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
             </select>
            :<input type={f.type||"text"} value={values[f.k]||""} placeholder={f.ph||""} onChange={e=>onChange({...values,[f.k]:e.target.value})} style={{...inp(),padding:"6px 9px",fontSize:12}}/>}
        </div>
      ))}
      <button onClick={()=>onChange({})} style={{...btn("ghost"),padding:"6px 12px",fontSize:11,alignSelf:"flex-end"}}>Clear</button>
    </div>
  );
}

export function StatCard({label,value,sub,color=C.brand,icon}){
  return (
    <div style={{...card(16),flex:1,minWidth:140}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em"}}>{label}</div>
          <div style={{fontSize:26,fontWeight:900,color:C.ink,marginTop:4,letterSpacing:"-.03em"}}>{value}</div>
          {sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}
        </div>
        {icon&&<div style={{width:40,height:40,borderRadius:10,background:color+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{icon}</div>}
      </div>
    </div>
  );
}

