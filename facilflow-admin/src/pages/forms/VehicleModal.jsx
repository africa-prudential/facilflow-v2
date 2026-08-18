import { useState } from "react";
import { C, btn, inp, sel, LBL } from "../../theme.js";
import { Modal } from "../../components/ui.jsx";
import { isDirty } from "../../utils.js";
import { VEHICLE_CATEGORIES } from "../../constants.js";

export default function VehicleModal({vehicle,onClose,onSave}){
  const [d,setD]=useState(vehicle
    ?{plate:vehicle.plate,model:vehicle.model,year:vehicle.year,color:vehicle.color,category:vehicle.category||"Status Car",ownershipType:vehicle.ownershipType||"Company",companyName:vehicle.companyName||"",coOwnerName:vehicle.coOwnerName||""}
    :{plate:"",model:"",year:new Date().getFullYear(),color:"White",category:"Status Car",ownershipType:"Company",companyName:"Africa Prudential",coOwnerName:""});
  const [initial]=useState(d);
  const [saving,setSaving]=useState(false);
  const dirty = !vehicle || isDirty(d,initial);

  const handleSave=async()=>{
    if(!d.plate||!d.model) return;
    setSaving(true);
    try{
      await onSave(d);
      onClose();
    }catch(_){ /* error already flashed by page-level save */ }
    finally{ setSaving(false); }
  };

  return (
    <Modal title={vehicle?"Edit Vehicle":"Add Vehicle"} onClose={onClose} w={520}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Plate Number</label><input value={d.plate} onChange={e=>setD(p=>({...p,plate:e.target.value}))} style={inp()} placeholder="e.g. AAA-001BE"/></div>
        <div><label style={LBL}>Model</label><input value={d.model} onChange={e=>setD(p=>({...p,model:e.target.value}))} style={inp()} placeholder="e.g. Toyota Camry"/></div>
        <div><label style={LBL}>Year</label><input type="number" value={d.year} onChange={e=>setD(p=>({...p,year:+e.target.value}))} style={inp()}/></div>
        <div><label style={LBL}>Colour</label><input value={d.color} onChange={e=>setD(p=>({...p,color:e.target.value}))} style={inp()} placeholder="e.g. Silver"/></div>
        <div>
          <label style={LBL}>Category</label>
          <select value={d.category} onChange={e=>setD(p=>({...p,category:e.target.value}))} style={sel()}>
            {VEHICLE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={LBL}>Ownership Type</label>
          <select value={d.ownershipType} onChange={e=>setD(p=>({...p,ownershipType:e.target.value}))} style={sel()}>
            <option value="Company">Company</option>
            <option value="Joint">Joint</option>
          </select>
        </div>
        <div><label style={LBL}>Company Name</label><input value={d.companyName} onChange={e=>setD(p=>({...p,companyName:e.target.value}))} style={inp()} placeholder="e.g. Africa Prudential"/></div>
        {d.ownershipType==="Joint"&&(
          <div style={{gridColumn:"1/-1"}}><label style={LBL}>Co-owner Name</label><input value={d.coOwnerName} onChange={e=>setD(p=>({...p,coOwnerName:e.target.value}))} style={inp()} placeholder="e.g. Joseph Adeyemi"/></div>
        )}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} disabled={saving} style={btn("ghost")}>Cancel</button>
        <button onClick={handleSave}
          disabled={saving||!d.plate||!d.model||!dirty}
          style={{...btn("primary"),minWidth:130,justifyContent:"center",opacity:saving||!d.plate||!d.model||!dirty?0.6:1}}>
          {saving?"Saving…":(vehicle?"Save Changes":"Add Vehicle")}
        </button>
      </div>
    </Modal>
  );
}

