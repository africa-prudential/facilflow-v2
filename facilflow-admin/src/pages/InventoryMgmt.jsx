import { useState } from "react";
import { C, btn, card } from "../theme.js";
import { fmtD, genId, normInv } from "../utils.js";
import { createInventoryItem, updateInventoryItem } from "../lib/supabase.js";
import { PageTitle, TH, Empty, Filters } from "../components/ui.jsx";
import ItemModal from "./forms/ItemModal.jsx";
import StockModal from "./forms/StockModal.jsx";

export default function InventoryMgmt({ctx}){
  const {inventory,setInv,addAudit,flash,tid}=ctx;
  const [f,setF]      = useState({});
  const [modal,setModal]=useState(null);

  const shown=inventory.filter(i=>{
    if(f.category&&i.category!==f.category)return false;
    if(f.q){const q=f.q.toLowerCase();if(!i.name.toLowerCase().includes(q)&&!i.code.toLowerCase().includes(q))return false;}
    return true;
  });
  const cats=[...new Set(inventory.map(i=>i.category))];

  const addItem=async d=>{
    try{
      const {desc,...rest}=d;
      const rec={...rest,description:desc,id:genId("INV"),tenant_id:tid};
      const saved=await createInventoryItem(rec);
      setInv(p=>[...p,normInv(saved)]);addAudit("ITEM_ADDED",saved.id,`${d.name} added`);flash("Item added");
    }catch(e){flash(e.message,"error");}
  };
  const editItem=async(id,d)=>{
    try{
      const {desc,...rest}=d;
      const saved=await updateInventoryItem(id,{...rest,description:desc});
      setInv(p=>p.map(i=>i.id!==id?i:normInv(saved)));
      addAudit("ITEM_UPDATED",id,"Item details updated");flash("Item updated");
    }catch(e){flash(e.message,"error");}
  };
  const adjustStock=async(id,qty,op)=>{
    try{
      const item=inventory.find(i=>i.id===id);
      const ns=op==="add"?item.stock+qty:Math.max(0,item.stock-qty);
      const saved=await updateInventoryItem(id,{stock:ns});
      setInv(p=>p.map(i=>i.id!==id?i:saved));
      addAudit("STOCK_ADJUSTED",id,`${item.name} stock: ${item.stock} → ${ns}`);
      flash("Stock adjusted");
    }catch(e){flash(e.message,"error");}
  };

  return (
    <div>
      <PageTitle title="Inventory" sub="Manage stationery and equipment stock"
        action={<button onClick={()=>setModal("add")} style={btn("primary")}>+ Add Item</button>}/>
      <Filters values={f} onChange={setF} fields={[
        {k:"q",       label:"Search",   w:200,ph:"Item name or code…"},
        {k:"category",label:"Category", type:"select",w:150,opts:cats.map(v=>({v,l:v}))},
      ]}/>
      {inventory.filter(i=>i.stock<5).length>0&&(
        <div style={{padding:"10px 14px",borderRadius:8,background:C.amberBg,border:`1px solid ${C.amber}40`,marginBottom:14,fontSize:12,color:C.amber,fontWeight:600}}>
          ⚠ {inventory.filter(i=>i.stock<5).length} item(s) are low on stock. Review and reorder as needed.
        </div>
      )}
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["Item Name","Item Code","Category","Units Available","Unit","Description","Last Updated",""]}/>
          <tbody>
            {shown.length===0?<tr><td colSpan={8}><Empty icon="📦" title="No items found"/></td></tr>
            :shown.map((item,i)=>(
              <tr key={item.id} style={{borderBottom:i<shown.length-1?`1px solid #FAFAFA`:"none"}}>
                <td style={{padding:"11px 14px",fontSize:13,fontWeight:600,color:C.ink}}>{item.name}</td>
                <td style={{padding:"11px 14px",fontSize:12,color:C.muted,fontFamily:"monospace"}}>{item.code}</td>
                <td style={{padding:"11px 14px"}}><span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.surface,color:C.ink2}}>{item.category}</span></td>
                <td style={{padding:"11px 14px"}}>
                  <span style={{fontSize:14,fontWeight:700,color:item.stock<5?C.red:C.ink}}>{item.stock}</span>
                  {item.stock<5&&<span style={{fontSize:10,color:C.red,marginLeft:4,fontWeight:600}}>LOW</span>}
                </td>
                <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{item.unit}</td>
                <td style={{padding:"11px 14px",fontSize:12,color:C.muted,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.desc}</div></td>
                <td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmtD(item.lastUpdated)}</td>
                <td style={{padding:"11px 14px"}}>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>setModal({adjust:item})} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>± Stock</button>
                    <button onClick={()=>setModal({edit:item})} style={{...btn("ghost"),fontSize:11,padding:"4px 8px"}}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal==="add"&&<ItemModal onClose={()=>setModal(null)} onSave={addItem}/>}
      {modal?.edit&&<ItemModal item={modal.edit} onClose={()=>setModal(null)} onSave={d=>editItem(modal.edit.id,d)}/>}
      {modal?.adjust&&<StockModal item={modal.adjust} onClose={()=>setModal(null)} onSave={adjustStock}/>}
    </div>
  );
}

