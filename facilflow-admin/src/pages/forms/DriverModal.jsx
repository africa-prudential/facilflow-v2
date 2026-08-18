import { useState } from "react";
import { C, btn, inp, sel, LBL } from "../../theme.js";
import { DRIVER_STATUSES } from "../../constants.js";
import { Modal } from "../../components/ui.jsx";
import { isDirty } from "../../utils.js";

export default function DriverModal({driver,vehicles,onClose,onSave}){
  const [d,setD]=useState(driver?{id:driver.id,name:driver.name,license:driver.license,phone:driver.phone,status:driver.status,vehicleId:driver.vehicleId||""}:{name:"",license:"",phone:"",status:"available",vehicleId:""});
  const [initial]=useState(d);
  const [saving,setSaving]=useState(false);
  const dirty = !driver || isDirty(d,initial);

  const handleSave=async()=>{
    if(!d.name||!d.license) return;
    setSaving(true);
    try{
      await onSave({...d,vehicleId:d.vehicleId||null});
      onClose();
    }catch(_){ /* error already flashed by page-level save */ }
    finally{ setSaving(false); }
  };

  return (
    <Modal title={driver?"Edit Driver":"Register Driver"} onClose={onClose} w={500}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Full Name</label><input value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} style={inp()} placeholder="Driver full name"/></div>
        <div><label style={LBL}>Licence Number</label><input value={d.license} onChange={e=>setD(p=>({...p,license:e.target.value}))} style={inp()} placeholder="LGA-2024-XXXX"/></div>
        <div><label style={LBL}>Phone</label><input value={d.phone} onChange={e=>setD(p=>({...p,phone:e.target.value}))} style={inp()} placeholder="+234 xxx xxxx xxx"/></div>
        <div><label style={LBL}>Status</label>
          <select value={d.status} onChange={e=>setD(p=>({...p,status:e.target.value}))} style={sel()}>
            {DRIVER_STATUSES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Assign Vehicle</label>
          <select value={d.vehicleId} onChange={e=>setD(p=>({...p,vehicleId:e.target.value}))} style={sel()}>
            <option value="">— No vehicle —</option>
            {vehicles.filter(v=>v.status!=="out_of_service").map(v=><option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} disabled={saving} style={btn("ghost")}>Cancel</button>
        <button onClick={handleSave}
          disabled={saving||!d.name||!d.license||!dirty}
          style={{...btn("primary"),minWidth:130,justifyContent:"center",opacity:saving||!d.name||!d.license||!dirty?0.6:1}}>
          {saving?"Saving…":(driver?"Save Changes":"Register Driver")}
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// INVENTORY MANAGEMENT
// ══════════════════════════════════════════════════════════════
