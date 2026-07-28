import { useState } from "react";
import { C, btn, inp, LBL } from "../../theme.js";
import { Modal } from "../../components/ui.jsx";

export default function PoolCarForm({onClose,onSubmit}){
  const [title,  setTitle]  = useState("");
  const [pickup, setPickup] = useState("");
  const [dest,   setDest]   = useState("");
  const [date,   setDate]   = useState("");
  const [start,  setStart]  = useState("09:00");
  const [end,    setEnd]    = useState("17:00");
  const [pax,    setPax]    = useState(1);
  const [purpose,setPurpose]= useState("");
  const [errs,   setErrs]   = useState({});

  const go=()=>{
    const er={};
    if(!title)  er.title="Required";
    if(!pickup) er.pickup="Required";
    if(!dest)   er.dest="Required";
    if(!date)   er.date="Required";
    if(!purpose)er.purpose="Required";
    setErrs(er);
    if(Object.keys(er).length) return;
    onSubmit({type:"pool_car",title,details:{pickup,destination:dest,date,start,end,passengers:pax,purpose}});
    onClose();
  };
  return (
    <Modal title="Pool Car Request" onClose={onClose} w={580}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{gridColumn:"1/-1"}}>
          <label style={LBL}>Title{errs.title&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.title}</span>}</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Client Visit – Victoria Island" style={inp(!!errs.title)}/>
        </div>
        <div>
          <label style={LBL}>Pickup Location{errs.pickup&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.pickup}</span>}</label>
          <input value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="AP Head Office" style={inp(!!errs.pickup)}/>
        </div>
        <div>
          <label style={LBL}>Destination{errs.dest&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.dest}</span>}</label>
          <input value={dest} onChange={e=>setDest(e.target.value)} placeholder="Victoria Island Branch" style={inp(!!errs.dest)}/>
        </div>
        <div>
          <label style={LBL}>Date{errs.date&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.date}</span>}</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp(!!errs.date)}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}><label style={LBL}>Start Time</label><input type="time" value={start} onChange={e=>setStart(e.target.value)} style={inp()}/></div>
          <div style={{flex:1}}><label style={LBL}>End Time</label><input type="time" value={end} onChange={e=>setEnd(e.target.value)} style={inp()}/></div>
        </div>
        <div>
          <label style={LBL}>Passengers</label>
          <input type="number" min={1} max={6} value={pax} onChange={e=>setPax(+e.target.value)} style={inp()}/>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={LBL}>Purpose{errs.purpose&&<span style={{color:C.red,fontWeight:400,textTransform:"none"}}> · {errs.purpose}</span>}</label>
          <textarea value={purpose} onChange={e=>setPurpose(e.target.value)} style={{...inp(),minHeight:68,resize:"vertical"}} placeholder="Business purpose for this trip..."/>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Cancel</button>
        <button onClick={go} style={btn("primary")}>Submit Request</button>
      </div>
    </Modal>
  );
}

