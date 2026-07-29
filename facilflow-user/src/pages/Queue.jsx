import { useState } from "react";
import { C, btn, card } from "../theme.js";
import { RQChip, PageTitle, TH, Empty, Filters } from "../components/ui.jsx";
import ReqDetail from "./forms/ReqDetail.jsx";

export default function Queue({ctx}){
  const {reqs,transReq}=ctx;
  const [detail,setDetail]=useState(null);
  const [f,setF]=useState({});
  const queue=reqs.filter(r=>["approved","in_progress"].includes(r.status));
  const shown=queue.filter(r=>{if(f.type&&r.type!==f.type)return false;return true;});
  return (
    <div>
      <PageTitle title="Processing Queue" sub="Fulfil approved facility requests"/>
      <Filters values={f} onChange={setF} fields={[
        {k:"type",label:"Type",type:"select",w:140,opts:[{v:"pool_car",l:"Pool Car"},{v:"stationary",l:"Stationery"}]},
      ]}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["ID","Type","Title","Requested By","Status","Action"]}/>
          <tbody>
            {shown.length===0?<tr><td colSpan={6}><Empty icon="✅" title="Queue is empty"/></td></tr>
            :shown.map((r,i)=>(
              <tr key={r.id} style={{borderBottom:i<shown.length-1?`1px solid #FAFAFA`:"none"}}>
                <td style={{padding:"11px 14px",fontSize:11,fontWeight:700}}>{r.id}</td>
                <td style={{padding:"11px 14px"}}><span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:4,background:r.type==="pool_car"?C.brandLt:C.blueBg,color:r.type==="pool_car"?C.brand:C.blue}}>{r.type==="pool_car"?"Pool Car":"Stationery"}</span></td>
                <td style={{padding:"11px 14px",fontSize:12,color:C.ink}}>{r.title}</td>
                <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{users[r.submitted_by]?.name}</td>
                <td style={{padding:"11px 14px"}}><RQChip s={r.status}/></td>
                <td style={{padding:"11px 14px"}}>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>setDetail(r)} style={{...btn("ghost"),fontSize:11,padding:"4px 9px"}}>View</button>
                    {r.status==="approved"    &&<button onClick={()=>transReq(r.id,"in_progress")} style={{...btn("primary"),fontSize:11,padding:"4px 9px"}}>▶ Process</button>}
                    {r.status==="in_progress" &&<button onClick={()=>transReq(r.id,"completed")}  style={{...btn("success"),fontSize:11,padding:"4px 9px"}}>✓ Complete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail&&<ReqDetail req={detail} onClose={()=>setDetail(null)} ctx={ctx}/>}
    </div>
  );
}

