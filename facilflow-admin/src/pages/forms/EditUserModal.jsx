import { useState } from "react";
import { C, btn, inp, LBL } from "../../theme.js";
import { STAFF_ROLES, ADMIN_ROLE_TYPES, ADMIN_ROLE_META } from "../../constants.js";
import { getAdminRoles } from "../../utils.js";
import { Chip, Modal } from "../../components/ui.jsx";

export default function EditUserModal({user,onClose,onSave}){
  const isAdminUser = ADMIN_ROLE_TYPES.includes(user.role) || user.role==="admin";
  const initialAdminRoles = isAdminUser ? getAdminRoles(user) : [];

  // Split existing name into first/last (everything after first space = last name)
  const nameParts = (user.name||"").trim().split(/\s+/);
  const [firstName,  setFirstName] = useState(nameParts[0]||"");
  const [lastName,   setLastName]  = useState(nameParts.slice(1).join(" ")||"");
  const [dept,       setDept]      = useState(user.dept);
  const [staffRole,  setStaffRole] = useState(isAdminUser ? "employee" : user.role);
  const [adminRoles, setAdminRoles]= useState(initialAdminRoles.length ? initialAdminRoles : ["facility_admin"]);
  const [isAdmin,    setIsAdmin]   = useState(isAdminUser);
  const [saving,     setSaving]    = useState(false);

  const toggleAdminRole = (r) => {
    setAdminRoles(prev =>
      prev.includes(r) ? prev.filter(x=>x!==r) : [...prev, r]
    );
  };

  const save=async()=>{
    if(!firstName.trim()) return;
    const primaryRole = isAdmin ? adminRoles[0] : staffRole;
    const fullName = lastName.trim() ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim();
    const updates = {
      name:       fullName,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      dept,
      role: primaryRole,
      admin_roles: isAdmin ? adminRoles : [],
    };
    setSaving(true);
    try{
      await onSave(user.id, updates);
      onClose();
    }catch(_){ /* error already flashed by updateUserLocal */ }
    finally{ setSaving(false); }
  };

  return (
    <Modal title="Edit User" sub={user.email} onClose={onClose} w={520}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <label style={LBL}>First Name *</label>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} style={inp()}/>
          </div>
          <div>
            <label style={LBL}>Last Name</label>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} style={inp()}/>
          </div>
        </div>

        {/* Account type switcher */}
        <div>
          <label style={LBL}>Account Type</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:false,l:"Staff User"},{v:true,l:"Admin User"}].map(opt=>(
              <button key={String(opt.v)} onClick={()=>setIsAdmin(opt.v)} style={{
                flex:1,padding:"7px 0",borderRadius:6,border:`1.5px solid ${isAdmin===opt.v?C.brand:C.border}`,
                background:isAdmin===opt.v?C.brandLt:"#fff",color:isAdmin===opt.v?C.brand:C.muted,
                fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {isAdmin ? (
          <div>
            <label style={LBL}>Admin Roles</label>
            <div style={{display:"flex",flexDirection:"column",gap:8,padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:"#FAFAFA"}}>
              {ADMIN_ROLE_TYPES.map(r=>{
                const m = ADMIN_ROLE_META[r];
                const checked = adminRoles.includes(r);
                return (
                  <label key={r} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                    <input type="checkbox" checked={checked} onChange={()=>toggleAdminRole(r)}
                      style={{width:14,height:14,accentColor:m.color,cursor:"pointer"}}/>
                    <Chip label={m.label} color={m.color} bg={m.bg}/>
                    <span style={{fontSize:12,color:C.muted}}>
                      {r==="super_admin"?"Full platform access" : r==="facility_admin"?"Facilities & operations" : "Change management & IT governance"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <label style={LBL}>Staff Role</label>
            <select value={staffRole} onChange={e=>setStaffRole(e.target.value)} style={inp()}>
              {STAFF_ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={LBL}>Department</label>
          <select value={dept} onChange={e=>setDept(e.target.value)} style={inp()}>
            {["Finance","HR","IT","Operations","Legal","Facilities","Compliance"].map(dep=><option key={dep} value={dep}>{dep}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")} disabled={saving}>Cancel</button>
        <button onClick={save} style={btn("primary")} disabled={saving}>{saving?"Saving…":"Save Changes"}</button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// FLEET MANAGEMENT
// ══════════════════════════════════════════════════════════════
