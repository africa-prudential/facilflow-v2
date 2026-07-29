import { useState } from "react";
import { C, btn, inp, LBL } from "../../theme.js";
import { Modal } from "../../components/ui.jsx";

export default function StatForm({onClose,onSubmit,invItems=[]}){
  const [title,setTitle]=useState("");
  const [items,setItems]=useState([{id:"",qty:1}]);
  const [urg,setUrg]=useState("normal");
  const [notes,setNotes]=useState("");
  const go=()=>{
    if(!title||items.some(i=>!i.id))return;
    onSubmit({type:"stationary",title,details:{items,urgency:urg,notes}});onClose();
  };
  return (
    <Modal title="Stationery Request" onClose={onClose} w={520}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><label style={LBL}>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} style={inp()} placeholder="e.g. Monthly Office Supplies"/></div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <label style={{...LBL,marginBottom:0}}>Items</label>
            <button onClick={()=>setItems(p=>[...p,{id:"",qty:1}])} style={{...btn("ghost"),fontSize:11,padding:"3px 8px"}}>+ Add</button>
          </div>
          {items.map((it,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
              <select value={it.id} onChange={e=>setItems(p=>p.map((x,j)=>j===i?{...x,id:e.target.value}:x))} style={{...inp(),flex:2}}>
                <option value="">Select item…</option>
                {invItems.map(inv=><option key={inv.id} value={inv.id}>{inv.name} ({inv.stock} {inv.unit}s)</option>)}
              </select>
              <input type="number" min={1} value={it.qty} onChange={e=>setItems(p=>p.map((x,j)=>j===i?{...x,qty:+e.target.value}:x))} style={{...inp(),width:64}}/>
              {items.length>1&&<button onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))} style={{...btn("ghost"),padding:"6px 9px",color:C.red}}>✕</button>}
            </div>
          ))}
        </div>
        <div><label style={LBL}>Urgency</label>
          <div style={{display:"flex",gap:8}}>
            {["low","normal","high"].map(u=>(
              <button key={u} onClick={()=>setUrg(u)} style={{flex:1,padding:8,fontFamily:"inherit",
                border:`1.5px solid ${urg===u?C.brand:C.border}`,borderRadius:6,
                background:urg===u?C.brandLt:"#fff",color:urg===u?C.brand:C.muted,
                fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{u}</button>
            ))}
          </div>
        </div>
        <div><label style={LBL}>Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} style={{...inp(),minHeight:56,resize:"vertical"}} placeholder="Additional notes…"/></div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Cancel</button>
        <button onClick={go}      style={{...btn("primary"),background:C.blue}}>Submit</button>
      </div>
    </Modal>
  );
}

