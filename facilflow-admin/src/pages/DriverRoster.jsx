import { useState } from "react";
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

  const shown=drivers.filter(d=>{
    if(f.status&&d.status!==f.status)return false;
    if(f.q){const q=f.q.toLowerCase();if(!d.name.toLowerCase().includes(q)&&!d.license.toLowerCase().includes(q))return false;}
    return true;
  });

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
            {shown.length===0?<tr><td colSpan={7}><Empty icon="🪪" title="No drivers found"/></td></tr>
            :shown.map((d,i)=>{
              const veh=vehicles.find(v=>v.id===d.vehicleId);
              return (
                <tr key={d.id} style={{borderBottom:i<shown.length-1?`1px solid #FAFAFA`:"none"}}>
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
      </div>
      {modal!==null&&<DriverModal driver={modal.id?modal:null} vehicles={vehicles} onClose={()=>setModal(null)} onSave={save}/>}
    </div>
  );
}

