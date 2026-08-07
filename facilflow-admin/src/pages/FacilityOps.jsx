import { useState } from "react";
import { Search, Check } from "lucide-react";
import { C, inp, card } from "../theme.js";
import { Av, PageTitle, TH, Empty } from "../components/ui.jsx";
import { updateUser } from "../lib/supabase.js";

export default function FacilityOps({ctx}){
  const {users,setUsers,flash}=ctx;
  const [search,setSearch]=useState("");
  const [saving,setSaving]=useState(null);

  const facilitiesUsers = users.filter(u=>u.dept==="Facilities");
  const shown = facilitiesUsers.filter(u=>{
    if(!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const toggle = async u => {
    setSaving(u.id);
    try{
      await updateUser(u.id,{is_facility_ops:!u.is_facility_ops});
      setUsers(p=>p.map(x=>x.id===u.id?{...x,is_facility_ops:!x.is_facility_ops}:x));
      flash(`Facility Ops ${u.is_facility_ops?"removed":"assigned"}`);
    }catch(e){ flash(e.message,"error"); }
    finally{ setSaving(null); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageTitle title="Facility Ops" sub="Assign facility request fulfillment access to Facilities department staff"/>

      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,display:"flex"}}><Search size={14}/></span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Facilities staff…" style={{...inp(),paddingLeft:30}}/>
      </div>

      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <TH cols={["User","Email","Facility Ops"]}/>
          <tbody>
            {shown.length===0?(
              <tr><td colSpan={3}><Empty icon={<Search size={32}/>} title={facilitiesUsers.length===0?"No users in the Facilities department yet":"No matches"}/></td></tr>
            ):shown.map((u,i)=>(
              <tr key={u.id} style={{borderBottom:i<shown.length-1?`1px solid #F8FAFC`:"none"}}>
                <td style={{padding:"11px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Av i={u.initials||"?"} s={28}/>
                    <span style={{fontSize:13,fontWeight:600,color:C.ink}}>{u.name}</span>
                  </div>
                </td>
                <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{u.email}</td>
                <td style={{padding:"11px 14px"}}>
                  <button
                    onClick={()=>toggle(u)}
                    disabled={saving===u.id}
                    title={u.is_facility_ops?"Remove Facility Ops":"Assign Facility Ops"}
                    style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${u.is_facility_ops?C.green:C.border}`,
                      background:u.is_facility_ops?C.green:"#fff",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",opacity:saving===u.id?.5:1}}>
                    {saving===u.id?"…":u.is_facility_ops?<Check size={13} color="#fff"/>:""}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:"9px 14px",borderTop:`1px solid #F8FAFC`,fontSize:11,color:C.muted}}>
          {shown.length} Facilities staff
        </div>
      </div>
    </div>
  );
}
