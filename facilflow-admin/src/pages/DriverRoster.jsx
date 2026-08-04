import { useState, useEffect } from "react";
import { C, btn, card } from "../theme.js";
import { DRIVER_STATUSES } from "../constants.js";
import { fmtD, genId, normDrv } from "../utils.js";
import { createDriver, updateDriver } from "../lib/supabase.js";
import { Av, DChip, PageTitle, TH, Empty, Filters } from "../components/ui.jsx";
import DriverModal from "./forms/DriverModal.jsx";

export default function DriverRoster({ctx}){
  const {drivers,setDrivers,vehicles,addAudit,flash,tid}=ctx;
  const [f,setF]      = useState({});
  const [modal,setModal]=useState(null);
  const [page,setPage]    = useState(1);
  const [pageSize,setPageSize] = useState(20);

  const shown=drivers.filter(d=>{
    if(f.status&&d.status!==f.status)return false;
    if(f.q){const q=f.q.toLowerCase();if(!d.name.toLowerCase().includes(q)&&!d.license.toLowerCase().includes(q))return false;}
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);
  useEffect(()=>{ setPage(1); },[f,pageSize]);

  const save=async d=>{
    try{
      const licTrimmed=(d.license||"").trim();
      if(!d.name?.trim()||!licTrimmed){ flash("Name and licence number are required","error"); return; }
      // Licence uniqueness check
      const dupLic=drivers.find(dr=>dr.license.trim().toLowerCase()===licTrimmed.toLowerCase()&&dr.id!==d.id);
      if(dupLic){ flash(`Licence ${licTrimmed} is already registered to ${dupLic.name}`,"error"); return; }

      if(d.id){
        const saved=await updateDriver(d.id,{name:d.name.trim(),license:licTrimmed,phone:d.phone,status:d.status,vehicle_id:d.vehicleId||null});
        setDrivers(p=>p.map(r=>r.id!==d.id?r:normDrv(saved)));
        addAudit("DRIVER_UPDATED",d.id,"Driver details updated");flash("Driver updated");
      } else {
        const rec={name:d.name.trim(),license:licTrimmed,phone:d.phone,status:d.status,id:genId("DRV"),tenant_id:tid,vehicle_id:d.vehicleId||null};
        const saved=await createDriver(rec);
        setDrivers(p=>[...p,normDrv(saved)]);
        addAudit("DRIVER_ADDED",saved.id,`Driver ${d.name} registered`);flash("Driver added");
      }
    }catch(e){flash(e.message,"error");}
  };

  return (
    <div>
      <PageTitle title="Driver Roster" sub="Manage drivers, licences and vehicle assignments"
        action={<button onClick={()=>setModal({})} style={btn("primary")}>+ Register Driver</button>}/>
      <Filters values={f} onChange={setF} fields={[
        {k:"q",     label:"Search",  w:180,ph:"Name or licence…"},
        {k:"status",label:"Status",  type:"select",w:150,opts:DRIVER_STATUSES.map(s=>({v:s.v,l:s.l}))},
      ]}/>
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Driver Name","Licence Number","Phone","Status","Assigned Vehicle","Last Updated",""]}/>
          <tbody>
            {paged.length===0?<tr><td colSpan={7}><Empty icon="🪪" title="No drivers found"/></td></tr>
            :paged.map((d,i)=>{
              const veh=vehicles.find(v=>v.id===d.vehicleId);
              return (
                <tr key={d.id} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none"}}>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",gap:9,alignItems:"center"}}>
                      <Av i={d.name.split(" ").map(n=>n[0]).join("").slice(0,2)} s={28} bg={d.status==="suspended"||d.status==="resigned"?C.muted:C.blue}/>
                      <span style={{fontSize:13,fontWeight:600,color:C.ink}}>{d.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.muted,fontFamily:"monospace"}}>{d.license}</td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{d.phone}</td>
                  <td style={{padding:"11px 14px"}}><DChip s={d.status}/></td>
                  <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{veh?`${veh.plate} · ${veh.model}`:"— Unassigned"}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(d.lastUpdated)}</td>
                  <td style={{padding:"11px 14px"}}><button onClick={()=>setModal(d)} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>Edit</button></td>
                </tr>
              );
            })}
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
      {modal!==null&&<DriverModal driver={modal.id?modal:null} vehicles={vehicles} onClose={()=>setModal(null)} onSave={save}/>}
    </div>
  );
}

