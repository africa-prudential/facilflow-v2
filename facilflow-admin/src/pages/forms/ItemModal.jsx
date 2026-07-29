import { useState } from "react";
import { C, btn, inp, LBL } from "../../theme.js";
import { Modal } from "../../components/ui.jsx";

export default function ItemModal({item,onClose,onSave}){
  const [d,setD]=useState(item?{name:item.name,code:item.code,category:item.category,unit:item.unit,desc:item.desc,stock:item.stock}:{name:"",code:"",category:"Paper",unit:"unit",desc:"",stock:0});
  return (
    <Modal title={item?"Edit Item":"Add Inventory Item"} onClose={onClose} w={500}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Item Name</label><input value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} style={inp()} placeholder="e.g. A4 Paper (Ream)"/></div>
        <div><label style={LBL}>Item Code</label><input value={d.code} onChange={e=>setD(p=>({...p,code:e.target.value}))} style={inp()} placeholder="e.g. STA-001"/></div>
        <div><label style={LBL}>Category</label>
          <select value={d.category} onChange={e=>setD(p=>({...p,category:e.target.value}))} style={inp()}>
            {["Paper","Writing","Equipment","Electronics","Consumables","Furniture"].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Unit</label><input value={d.unit} onChange={e=>setD(p=>({...p,unit:e.target.value}))} style={inp()} placeholder="e.g. ream, box, unit"/></div>
        {!item&&<div><label style={LBL}>Initial Stock</label><input type="number" min={0} value={d.stock} onChange={e=>setD(p=>({...p,stock:+e.target.value}))} style={inp()}/></div>}
        <div style={{gridColumn:"1/-1"}}><label style={LBL}>Description</label><textarea value={d.desc} onChange={e=>setD(p=>({...p,desc:e.target.value}))} style={{...inp(),minHeight:64,resize:"vertical"}} placeholder="Brief description of the item…"/></div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Cancel</button>
        <button onClick={()=>{if(!d.name||!d.code)return;onSave(d);onClose()}} style={btn("primary")}>{item?"Save Changes":"Add Item"}</button>
      </div>
    </Modal>
  );
}

