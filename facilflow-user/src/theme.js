export const C = {
  brand:"#C8102E", brandDk:"#A00D24", brandLt:"#FEF2F4",
  white:"#FFFFFF", pageBg:"#F7F8FA", surface:"#EEF0F4",
  ink:"#0F172A", ink2:"#334155", muted:"#64748B", faint:"#94A3B8",
  border:"#E2E8F0", borderDk:"#CBD5E1",
  green:"#059669",  greenBg:"#ECFDF5",
  amber:"#D97706",  amberBg:"#FFFBEB",
  red:"#DC2626",    redBg:"#FEF2F2",
  blue:"#2563EB",   blueBg:"#EFF6FF",
  violet:"#7C3AED", violetBg:"#F5F3FF",
  orange:"#EA580C", orangeBg:"#FFF7ED",
  teal:"#0891B2",   tealBg:"#E0F7FA",
};

export const btn = (v="primary", extra={}) => ({
  display:"inline-flex", alignItems:"center", gap:6, padding:"7px 16px",
  borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
  fontFamily:"inherit", transition:"opacity .15s, box-shadow .15s", whiteSpace:"nowrap",
  ...(v==="primary"  ? {background:C.brand,   color:"#fff", boxShadow:`0 1px 3px ${C.brand}50`} :
      v==="ghost"    ? {background:"transparent", color:C.muted, border:`1px solid ${C.border}`} :
      v==="danger"   ? {background:C.red,     color:"#fff"} :
      v==="success"  ? {background:C.green,   color:"#fff"} :
      v==="violet"   ? {background:C.violet,  color:"#fff"} :
      v==="outline"  ? {background:"#fff",    color:C.brand, border:`1.5px solid ${C.brand}`} :
                       {background:C.surface, color:C.ink2}),
  ...extra,
});

export const inp = (err=false) => ({
  width:"100%", padding:"8px 11px", border:`1px solid ${err?C.red:C.border}`,
  borderRadius:6, fontSize:13, color:C.ink, background:"#fff",
  fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  transition:"border-color .15s",
});

export const card = (p=16) => ({
  background:"#fff", border:`1px solid ${C.border}`,
  borderRadius:10, padding:p, boxShadow:"0 1px 3px rgba(0,0,0,.05)",
});

export const LBL = { fontSize:12, fontWeight:500, color:C.muted, textTransform:"none",
              letterSpacing:".07em", display:"block", marginBottom:5 };
