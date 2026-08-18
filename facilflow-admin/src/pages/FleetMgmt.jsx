import { useState, useEffect } from "react";
import { AlertTriangle, Car } from "lucide-react";
import { C, btn, card } from "../theme.js";
import { VEHICLE_STATUSES } from "../constants.js";
import { worstDocStatus, genId, now, vsm, normVeh } from "../utils.js";
import { createVehicle, updateVehicle, upsertVehicleDoc, uploadVehicleDoc } from "../lib/supabase.js";
import { Chip, PageTitle, TH, Empty, Filters } from "../components/ui.jsx";
import VehicleModal from "./forms/VehicleModal.jsx";
import VehicleDocsModal from "./forms/VehicleDocsModal.jsx";

export default function FleetMgmt({ctx}){
  const {vehicles,setVehicles,vehicleDocs,setVehicleDocs,drivers,addAudit,flash,tid}=ctx;
  const [f,setF]        = useState({});
  const [modal,setModal] = useState(null);
  const [detail,setDetail] = useState(null);
  const [page,setPage]    = useState(1);
  const [pageSize,setPageSize] = useState(20);

  const shown = vehicles.filter(v=>{
    if(f.status && v.status!==f.status) return false;
    if(f.ownership && v.ownershipType!==f.ownership) return false;
    if(f.coOwner){const q=f.coOwner.toLowerCase();if(!(v.coOwnerName||"").toLowerCase().includes(q)) return false;}
    if(f.q){const q=f.q.toLowerCase();if(!v.model.toLowerCase().includes(q)&&!v.plate.toLowerCase().includes(q)) return false;}
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(shown.length/pageSize));
  const paged = shown.slice((page-1)*pageSize, page*pageSize);
  useEffect(()=>{ setPage(1); },[f,pageSize]);

  const updateStatus=async(id,status)=>{
    try{
      await updateVehicle(id,{status});
      setVehicles(p=>p.map(v=>v.id!==id?v:normVeh({...v,status,updated_at:now()})));
      addAudit("VEHICLE_STATUS",id,`Status changed to ${vsm(status).l}`);
      flash(`Vehicle status updated to ${vsm(status).l}`);
    }catch(e){flash(e.message,"error");}
  };

  const assignDriver=async(vId,dId)=>{
    if(dId){
      const alreadyOn=vehicles.find(v=>v.id!==vId&&v.driverId===dId);
      if(alreadyOn){ flash(`Driver is already assigned to ${alreadyOn.plate}. Remove them first.`,"error"); return; }
    }
    try{
      await updateVehicle(vId,{driver_id:dId||null});
      setVehicles(p=>p.map(v=>v.id!==vId?v:normVeh({...v,driver_id:dId||null})));
      flash("Driver assignment updated");
    }catch(e){flash(e.message,"error");}
  };

  const saveVehicle=async(data,existing)=>{
    try{
      const plateTrimmed=(data.plate||"").trim().toUpperCase();
      if(!plateTrimmed||!data.model) throw new Error("Plate number and model are required");
      if(!existing){
        const dup=vehicles.find(v=>v.plate.trim().toUpperCase()===plateTrimmed);
        if(dup) throw new Error(`Plate number ${plateTrimmed} already exists on ${dup.model}`);
      }
      const rec={
        plate:plateTrimmed, model:data.model, year:data.year, color:data.color,
        ownership_type:data.ownershipType||"Company",
        company_name:data.companyName||"",
        co_owner_name:data.ownershipType==="Joint"?data.coOwnerName||"":null,
      };
      if(existing){
        const saved=await updateVehicle(existing.id,rec);
        setVehicles(p=>p.map(v=>v.id!==existing.id?v:normVeh(saved)));
        addAudit("VEHICLE_UPDATED",existing.id,`${data.model} updated`);flash("Vehicle updated");
      } else {
        const saved=await createVehicle({...rec,id:genId("CAR"),tenant_id:tid,driver_id:null});
        setVehicles(p=>[...p,normVeh(saved)]);
        addAudit("VEHICLE_ADDED",saved.id,`${data.model} added`);flash("Vehicle added");
      }
    }catch(e){flash(e.message,"error"); throw e;}
  };

  const saveDoc=async(vehicleId,docType,expiryDate,attachmentUrl)=>{
    try{
      const saved=await upsertVehicleDoc({vehicle_id:vehicleId,document_type:docType,expiry_date:expiryDate,attachment_url:attachmentUrl||null,tenant_id:tid});
      setVehicleDocs(p=>{const out=p.filter(d=>!(d.vehicle_id===vehicleId&&d.document_type===docType));return [...out,saved];});
      addAudit("VEHICLE_DOC_UPDATED",vehicleId,`${docType} document updated`);
      flash(`${docType} document saved`);
    }catch(e){flash(e.message,"error");}
  };

  const uploadDoc=async(vehicleId,docType,file,expiryDate)=>{
    try{
      flash("Uploading…");
      const {publicUrl}=await uploadVehicleDoc(vehicleId,file);
      await saveDoc(vehicleId,docType,expiryDate,publicUrl);
    }catch(e){flash(e.message,"error");}
  };

  // Compliance alert banner
  const allDocs = vehicleDocs;
  const expiringVehicles = vehicles.filter(v=>{
    const vd=allDocs.filter(d=>d.vehicle_id===v.id);
    const w=worstDocStatus(vd);
    return w.l==="Expired"||w.l==="Expiring Soon";
  });

  return (
    <div>
      <PageTitle title="Fleet Management" sub="Vehicles, compliance documents and driver assignments"
        action={<button onClick={()=>setModal("add")} style={btn("primary")}>+ Add Vehicle</button>}/>

      {expiringVehicles.length>0&&(
        <div style={{padding:"10px 16px",borderRadius:8,background:C.amberBg,border:`1px solid ${C.amber}40`,marginBottom:14,fontSize:12,color:C.amber,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
          <AlertTriangle size={14}/> {expiringVehicles.length} vehicle(s) have expired or expiring compliance documents — review below.
        </div>
      )}

      <Filters values={f} onChange={setF} fields={[
        {k:"q",        label:"Search",         w:180, ph:"Plate or model…"},
        {k:"status",   label:"Status",          type:"select",w:160, opts:VEHICLE_STATUSES.map(s=>({v:s.v,l:s.l}))},
        {k:"ownership",label:"Ownership Type",  type:"select",w:150, opts:[{v:"Company",l:"Company"},{v:"Joint",l:"Joint"}]},
        {k:"coOwner",  label:"Co-owner Search", w:160, ph:"Co-owner name…"},
      ]}/>

      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Plate","Model","Year","Colour","Assigned Owner","Docs","Status","Driver",""]}/>
          <tbody>
            {paged.length===0
              ?<tr><td colSpan={9}><Empty icon={<Car size={32}/>} title="No vehicles found"/></td></tr>
              :paged.map((v,i)=>{
                const drv=drivers.find(d=>d.id===v.driverId);
                const vd=allDocs.filter(d=>d.vehicle_id===v.id);
                const ws=worstDocStatus(vd);
                const owner=v.ownershipType==="Joint"&&v.coOwnerName
                  ?`${v.companyName||"—"} / ${v.coOwnerName}`
                  :(v.companyName||"—");
                const rowBg = ws.l==="Expired"?`${C.red}07`:ws.l==="Expiring Soon"?`${C.amber}07`:"transparent";
                return (
                  <tr key={v.id} style={{borderBottom:i<paged.length-1?`1px solid #FAFAFA`:"none",background:rowBg}}>
                    <td style={{padding:"11px 14px",fontSize:12,fontWeight:700,color:C.ink}}>{v.plate}</td>
                    <td style={{padding:"11px 14px",fontSize:13,color:C.ink}}>{v.model}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{v.year}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{v.color}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.ink2}}>{owner}</td>
                    <td style={{padding:"11px 14px"}}>
                      <Chip label={ws.l} color={ws.color} bg={ws.bg}/>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <select value={v.status} onChange={e=>updateStatus(v.id,e.target.value)}
                        style={{border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:"#fff",color:vsm(v.status).color}}>
                        {VEHICLE_STATUSES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>
                      <select value={v.driverId||""} onChange={e=>assignDriver(v.id,e.target.value)}
                        style={{border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",background:"#fff",minWidth:130}}>
                        <option value="">— Unassigned —</option>
                        {drivers.filter(d=>{const assignedTo=vehicles.find(vv=>vv.driverId===d.id);return !assignedTo||assignedTo.id===v.id;}).map(d=><option key={d.id} value={d.id}>{d.name}{d.status==="suspended"?" (suspended)":""}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>setDetail(v)} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>Docs</button>
                        <button onClick={()=>setModal({edit:v})} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>Edit</button>
                      </div>
                    </td>
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

      {modal==="add"&&<VehicleModal onClose={()=>setModal(null)} onSave={d=>saveVehicle(d,null)}/>}
      {modal?.edit&&<VehicleModal vehicle={modal.edit} onClose={()=>setModal(null)} onSave={d=>saveVehicle(d,modal.edit)}/>}
      {detail&&<VehicleDocsModal vehicle={detail} docs={allDocs.filter(d=>d.vehicle_id===detail.id)} onClose={()=>setDetail(null)} onSaveDoc={saveDoc} onUploadDoc={uploadDoc}/>}
    </div>
  );
}

