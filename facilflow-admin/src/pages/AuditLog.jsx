import { useState } from "react";
import { C, card } from "../theme.js";
import { fmtDT } from "../utils.js";
import { PageTitle, TH, Empty, Filters } from "../components/ui.jsx";

export default function AuditLog({ctx}){
  const {audit}=ctx;
  const [f,setF]=useState({});
  const shown=audit.filter(a=>{
    if(f.q){const q=f.q.toLowerCase();if(!a.action.toLowerCase().includes(q)&&!a.target.toLowerCase().includes(q)&&!a.detail.toLowerCase().includes(q))return false;}
    return true;
  });
  const actColor=a=>a.includes("DELETE")||a.includes("SUSPEND")||a.includes("EMERGENCY")?C.red:a.includes("ADDED")||a.includes("INVITED")||a.includes("CREAT")?C.green:C.blue;
  return (
    <div>
      <PageTitle title="Audit Log" sub="System-wide activity and change history"/>
      <Filters values={f} onChange={setF} fields={[{k:"q",label:"Search",w:250,ph:"Action, target, or detail…"}]}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Timestamp","Action","Target","Detail","Performed By"]}/>
          <tbody>
            {shown.length===0?<tr><td colSpan={5}><Empty icon="📋" title="No audit entries found"/></td></tr>
            :shown.map((a,i)=>(
              <tr key={a.id} style={{borderBottom:i<shown.length-1?`1px solid #FAFAFA`:"none"}}>
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
        <div style={{padding:"9px 14px",borderTop:`1px solid #FAFAFA`,fontSize:11,color:C.muted}}>{shown.length} entries</div>
      </div>
    </div>
  );
}
