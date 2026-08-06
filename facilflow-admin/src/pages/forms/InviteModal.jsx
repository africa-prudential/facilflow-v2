import { useState } from "react";
import { Mail } from "lucide-react";
import { C, btn, inp, LBL } from "../../theme.js";
import { STAFF_ROLES, ADMIN_ROLE_TYPES, ADMIN_ROLE_META } from "../../constants.js";
import { Chip, Modal } from "../../components/ui.jsx";

// Unambiguous charset (no 0/O/1/l/I) so temp passwords are easy to read/type off an email
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

function generatePassword(length = 12) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, n => PASSWORD_CHARS[n % PASSWORD_CHARS.length]).join("");
}

export default function InviteModal({onClose,onInvite}){
  const [firstName,  setFirstName] = useState("");
  const [lastName,   setLastName]  = useState("");
  const [email,      setEmail]     = useState("");
  const [roleType,   setRoleType]  = useState("staff"); // "staff" | "admin"
  const [staffRole,  setStaffRole] = useState("employee");
  const [adminRoles, setAdminRoles]= useState(["facility_admin"]);
  const [dept,       setDept]      = useState("Finance");
  const [password,   setPass]      = useState(() => generatePassword());
  const [showPass,   setShowPass]  = useState(false);
  const [err,        setErr]       = useState("");

  const toggleAdminRole = (r) => {
    setAdminRoles(prev =>
      prev.includes(r)
        ? prev.filter(x=>x!==r)
        : [...prev, r]
    );
  };

  const go=()=>{
    setErr("");
    if(!firstName.trim()) return setErr("First name is required.");
    if(!lastName.trim())  return setErr("Last name is required.");
    if(!email)            return setErr("Email is required.");
    if(roleType==="admin" && adminRoles.length===0) return setErr("Select at least one admin role.");
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const primaryRole = roleType==="admin" ? adminRoles[0] : staffRole;
    onInvite(email, fullName, primaryRole, dept, password, roleType==="admin" ? adminRoles : [], firstName.trim(), lastName.trim());
    onClose();
  };

  return (
    <Modal title="Invite New User" sub="User will receive an email to access the platform" onClose={onClose} w={520}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <label style={LBL}>First Name *</label>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} style={inp()} placeholder="e.g. Adaeze"/>
          </div>
          <div>
            <label style={LBL}>Last Name *</label>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} style={inp()} placeholder="e.g. Okonkwo"/>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={LBL}>Email Address *</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} style={inp()} placeholder="user@africaprudential.com"/>
          </div>
        </div>

        {/* Role type switcher */}
        <div>
          <label style={LBL}>Account Type</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:"staff",l:"Staff User"},{v:"admin",l:"Admin User"}].map(opt=>(
              <button key={opt.v} onClick={()=>setRoleType(opt.v)} style={{
                flex:1,padding:"8px 0",borderRadius:6,border:`1.5px solid ${roleType===opt.v?C.brand:C.border}`,
                background:roleType===opt.v?C.brandLt:"#fff",color:roleType===opt.v?C.brand:C.muted,
                fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {roleType==="staff" ? (
          <div>
            <label style={LBL}>Staff Role</label>
            <select value={staffRole} onChange={e=>setStaffRole(e.target.value)} style={inp()}>
              {STAFF_ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label style={LBL}>Admin Roles (select all that apply)</label>
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
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <label style={LBL}>Department</label>
            <select value={dept} onChange={e=>setDept(e.target.value)} style={inp()}>
              {["Finance","HR","IT","Operations","Legal","Facilities","Compliance"].map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div/>
        </div>

        <div>
          <label style={LBL}>Temporary Password (auto-generated)</label>
          <div style={{display:"flex",gap:8}}>
            <input readOnly type={showPass?"text":"password"} value={password} style={{...inp(),flex:1,fontFamily:"monospace",letterSpacing:1}}/>
            <button type="button" onClick={()=>setShowPass(v=>!v)} style={btn("ghost")}>{showPass?"Hide":"Show"}</button>
            <button type="button" onClick={()=>setPass(generatePassword())} style={btn("ghost")}>Regenerate</button>
          </div>
        </div>

        {err && <div style={{padding:"9px 13px",borderRadius:7,background:C.redBg,border:`1px solid ${C.red}30`,fontSize:13,color:C.red,fontWeight:500}}>{err}</div>}
        <div style={{padding:"10px 13px",borderRadius:7,background:C.blueBg,border:`1px solid ${C.blue}30`,fontSize:12,color:C.blue,fontWeight:600,display:"flex",alignItems:"flex-start",gap:6}}>
          <Mail size={14} style={{flexShrink:0,marginTop:1}}/> User will receive an invite email with this temporary password, and will be required to set their own on first login.
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onClose} style={btn("ghost")}>Cancel</button>
        <button onClick={go} style={btn("primary")}>Send Invitation</button>
      </div>
    </Modal>
  );
}

