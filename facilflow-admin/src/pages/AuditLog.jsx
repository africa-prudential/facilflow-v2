import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { fmtDT } from "../utils.js";
import { PageTitle, TH, Empty, Filters } from "../components/ui.jsx";

export default function AuditLog({ctx}){
  const {audit}=ctx;
  const [f,setF]=useState({});
  const [page,setPage]    = useState(1);
  const [pageSize,setPageSize] = useState(20);
  const shown=audit.filter(a=>{
    if(f.q){const q=f.q.toLowerCase();if(!a.action.toLowerCase().includes(q)&&!a.target.toLowerCase().includes(q)&&!a.detail.toLowerCase().includes(q))return false;}
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);
  useEffect(()=>{ setPage(1); },[f,pageSize]);
  const actColor=a=>a.includes("DELETE")||a.includes("SUSPEND")||a.includes("EMERGENCY")?C.red:a.includes("ADDED")||a.includes("INVITED")||a.includes("CREAT")?C.green:C.blue;
  return (
    <div>
      <PageTitle title="Audit Log" sub="System-wide activity and change history"/>
      <Filters values={f} onChange={setF} fields={[{k:"q",label:"Search",w:250,ph:"Action, target, or detail…"}]}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Timestamp","Action","Target","Detail","Performed By"]}/>
          <tbody>
            {paged.length===0?<tr><td colSpan={5}><Empty icon={<ClipboardList size={32}/>} title="No audit entries found"/></td></tr>
            :paged.map((a,i)=>(
              <tr key={a.id} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none"}}>
                <td style={{padding:"10px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtDT(a.at)}</td>
                <td style={{padding:"10px 14px"}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:4,background:actColor(a.action)+"14",color:actColor(a.action),letterSpacing:".02em"}}>{a.action}</span>
                </td>
                <td style={{padding:"10px 14px",fontSize:12,color:C.ink,fontWeight:600}}>{a.target}</td>
                <td style={{padding:"10px 14px",fontSize:12,color:C.muted}}>{a.detail}</td>
                <td style={{padding:"10px 14px",fontSize:11,color:C.muted}}>Oluwaseun Balogun</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
}
