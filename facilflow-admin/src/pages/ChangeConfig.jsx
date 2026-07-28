import { useState } from "react";
import { C, inp, card } from "../theme.js";
import { Av, PageTitle } from "../components/ui.jsx";
import { assignChangeRole, removeChangeRole } from "../lib/supabase.js";

export default function ChangeConfig({ctx}){
  const {users,changeRoles,userCRoles,setUserCRoles,flash,tid}=ctx;
  const [search,setSearch]=useState("");
  const [saving,setSaving]=useState(null);

  // Build a map: userId -> array of role keys
  const roleMap = {};
  (userCRoles||[]).forEach(r=>{ if(!roleMap[r.user_id]) roleMap[r.user_id]=[]; roleMap[r.user_id].push(r.role_key); });

  const shown = users.filter(u=>{
    if(!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const toggleRole = async (userId, roleKey) => {
    const hasRole = (roleMap[userId]||[]).includes(roleKey);
    setSaving(userId+roleKey);
    try {
      if(hasRole){
        await removeChangeRole(userId, roleKey);
        setUserCRoles(p=>p.filter(r=>!(r.user_id===userId&&r.role_key===roleKey)));
      } else {
        const saved = await assignChangeRole(userId, roleKey, tid);
        setUserCRoles(p=>[...p, {user_id:userId, role_key:roleKey, ...saved}]);
      }
      flash(`Change role ${hasRole?"removed":"assigned"}`);
    } catch(e){ flash(e.message,"error"); }
    finally { setSaving(null); }
  };

  const CR_ROLES = (changeRoles||[]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageTitle title="Change Roles" sub="Assign change management roles to users — users can hold multiple roles"/>

      {/* Legend */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {CR_ROLES.map(r=>(
          <span key={r.key} style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:C.violetBg,color:C.violet,border:`1px solid ${C.violet}22`}}>
            {r.label}
          </span>
        ))}
      </div>

      {/* Search */}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" style={{...inp(),paddingLeft:30}}/>
      </div>

      {/* User role grid */}
      <div style={card(0)}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#FAFAFA"}}>
              <th style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}>User</th>
              <th style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",borderBottom:`1px solid ${C.border}`}}>Dept</th>
              {CR_ROLES.map(r=>(
                <th key={r.key} style={{padding:"9px 10px",textAlign:"center",fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",borderBottom:`1px solid ${C.border}`,minWidth:80}}>
                  {r.label.replace("Change ","").replace(" L1","L1").replace(" L2","L2")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((u,i)=>{
              const myRoles = roleMap[u.id]||[];
              return (
                <tr key={u.id} style={{borderBottom:i<shown.length-1?`1px solid #F8FAFC`:"none"}}>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Av i={u.initials||"?"} s={28}/>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:C.ink}}>{u.name}</div>
                        <div style={{fontSize:10,color:C.muted}}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:11,color:C.muted}}>{u.dept}</td>
                  {CR_ROLES.map(r=>{
                    const has = myRoles.includes(r.key);
                    const isSaving = saving===u.id+r.key;
                    return (
                      <td key={r.key} style={{padding:"11px 10px",textAlign:"center"}}>
                        <button
                          onClick={()=>toggleRole(u.id, r.key)}
                          disabled={!!isSaving}
                          style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${has?C.green:C.border}`,
                            background:has?C.green:"#fff",cursor:"pointer",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:13,margin:"0 auto",
                            opacity:isSaving?.5:1}}>
                          {isSaving?"…":has?"✓":""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:"9px 14px",borderTop:`1px solid #F8FAFC`,fontSize:11,color:C.muted}}>
          {shown.length} users · Click circles to toggle roles · Green = assigned
        </div>
      </div>
    </div>
  );
}

