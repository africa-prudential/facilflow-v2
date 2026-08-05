import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { Modal } from "../../components/ui.jsx";

export default function StockModal({item,onClose,onSave}){
  const [qty,setQty]=useState(1);
  const [op,setOp]=useState("add");
  const removeErr=op==="remove"&&qty>item.stock;
  const newStock=op==="add"?item.stock+qty:item.stock-qty;
  return (
    <Modal title="Adjust Stock" sub={item.name} onClose={onClose} w={400}>
      <div style={{marginBottom:14,display:"flex",gap:10}}>
        {[{v:"add",l:"Add Stock"},{v:"remove",l:"Remove Stock"}].map(o=>(
          <button key={o.v} onClick={()=>setOp(o.v)} style={{flex:1,padding:10,fontFamily:"inherit",
            border:`1.5px solid ${op===o.v?(o.v==="add"?C.green:C.red):C.border}`,borderRadius:7,
            background:op===o.v?(o.v==="add"?C.greenBg:C.redBg):"#fff",
            cursor:"pointer",fontSize:12,fontWeight:600,
            color:op===o.v?(o.v==="add"?C.green:C.red):C.muted}}>{o.v==="add"?"+ Add Stock":"− Remove Stock"}</button>
        ))}
      </div>
      <div style={{padding:"12px 14px",background:C.pageBg,borderRadius:8,marginBottom:14,display:"flex",justifyContent:"space-between",fontSize:13}}>
        <span style={{color:C.muted,fontWeight:600}}>Current stock:</span>
        <span style={{fontWeight:800,color:C.ink}}>{item.stock} {item.unit}s</span>
      </div>
      <div><label style={LBL}>Quantity to {op==="add"?"add":"remove"}</label>
        <input type="number" min={1} max={op==="remove"?item.stock:undefined} value={qty}
          onChange={e=>setQty(Math.max(1,+e.target.value))} style={inp(removeErr)}/>
      </div>
      {removeErr
        ?<div style={{marginTop:8,padding:"9px 12px",borderRadius:7,background:C.redBg,fontSize:12,color:C.red,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
           <AlertTriangle size={13}/> Cannot remove {qty} — only {item.stock} in stock. Adjust quantity.
         </div>
        :<div style={{marginTop:10,padding:"10px 13px",borderRadius:7,background:op==="add"?C.greenBg:C.redBg,fontSize:13,fontWeight:600,color:op==="add"?C.green:C.red}}>
           New stock: {newStock} {item.unit}s
         </div>
      }
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Cancel</button>
        <button onClick={()=>{if(removeErr)return;onSave(item.id,qty,op);onClose()}} disabled={removeErr}
          style={{...btn(op==="add"?"success":"danger"),opacity:removeErr?0.5:1}}>Confirm</button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// CHANGE REQUESTS (Admin View)
// ══════════════════════════════════════════════════════════════
