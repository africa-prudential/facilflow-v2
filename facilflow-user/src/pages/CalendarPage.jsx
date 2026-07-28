import { useState } from "react";
import { C, btn, card } from "../theme.js";
import { CRChip, EnvTag, PageTitle, TH, Empty } from "../components/ui.jsx";

export default function CalendarPage({ctx}){
  const {crs,users} = ctx;
  const [month, setMonth] = useState(()=>{
    const n=new Date(); return {year:n.getFullYear(),month:n.getMonth()};
  });

  const scheduled = (crs||[]).filter(c=>
    c.deploy_date && ["scheduled","in_progress","pending_implementation"].includes(c.status)
  );

  // Build calendar grid
  const firstDay = new Date(month.year, month.month, 1).getDay();
  const daysInMonth = new Date(month.year, month.month+1, 0).getDate();
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  const getDeploysForDay = (day) => {
    if(!day) return [];
    const dateStr = `${month.year}-${String(month.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return scheduled.filter(c=>(c.deploy_date||c.deployDate)===dateStr);
  };

  const today = new Date();
  const isToday = (day) => day===today.getDate() && month.month===today.getMonth() && month.year===today.getFullYear();

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const typeColor = (t) => {
    const map = {
      Standard:{bg:C.blueBg,color:C.blue},
      Normal:  {bg:C.violetBg,color:C.violet},
      Major:   {bg:C.orangeBg||C.amberBg,color:C.orange||C.amber},
      Emergency:{bg:C.redBg,color:C.red},
    };
    return map[t]||{bg:C.pageBg,color:C.muted};
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <PageTitle title="Change Calendar" sub="Scheduled deployments and change windows"/>

      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",gap:16,...card(14)}}>
        <button onClick={()=>setMonth(p=>{ const d=new Date(p.year,p.month-1,1); return {year:d.getFullYear(),month:d.getMonth()}; })}
          style={{...btn("ghost"),padding:"5px 12px"}}>‹</button>
        <div style={{flex:1,textAlign:"center",fontSize:16,fontWeight:800,color:C.ink}}>
          {MONTHS[month.month]} {month.year}
        </div>
        <button onClick={()=>setMonth(p=>{ const d=new Date(p.year,p.month+1,1); return {year:d.getFullYear(),month:d.getMonth()}; })}
          style={{...btn("ghost"),padding:"5px 12px"}}>›</button>
        <button onClick={()=>setMonth({year:today.getFullYear(),month:today.getMonth()})}
          style={{...btn("ghost"),fontSize:11,padding:"5px 12px"}}>Today</button>
      </div>

      {/* Calendar grid */}
      <div style={card(0)}>
        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:`1px solid ${C.border}`}}>
          {DAYS.map(d=>(
            <div key={d} style={{padding:"10px 0",textAlign:"center",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em"}}>{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {cells.map((day,i)=>{
            const deploys = getDeploysForDay(day);
            const today_ = isToday(day);
            return (
              <div key={i} style={{
                minHeight:90, padding:"8px 6px",
                borderRight:  (i+1)%7===0?"none":`1px solid ${C.border}`,
                borderBottom: i<cells.length-7?`1px solid ${C.border}`:"none",
                background:   !day?"#FAFAFA":today_?`${C.brand}06`:"#fff",
              }}>
                {day&&(
                  <>
                    <div style={{
                      width:24,height:24,borderRadius:"50%",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:12,fontWeight:today_?800:500,
                      background:today_?C.brand:"transparent",
                      color:today_?"#fff":C.ink,
                      marginBottom:4,
                    }}>{day}</div>
                    {deploys.map((c,j)=>{
                      const tc = typeColor(c.change_type||c.changeType);
                      return (
                        <div key={j} style={{
                          fontSize:9,fontWeight:600,padding:"2px 5px",borderRadius:4,
                          background:tc.bg,color:tc.color,
                          marginBottom:2,overflow:"hidden",
                          textOverflow:"ellipsis",whiteSpace:"nowrap",
                          cursor:"default",
                        }} title={`${c.id}: ${c.title}`}>
                          {c.id} {c.title}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming deployments list */}
      {scheduled.length>0&&(
        <div style={card(0)}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.ink}}>
            Upcoming Scheduled Changes ({scheduled.length})
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <TH cols={["CR ID","Title","Type","Environment","Deploy Date","Window","Status"]}/>
            <tbody>
              {scheduled.sort((a,b)=>(a.deploy_date||"").localeCompare(b.deploy_date||"")).map((c,i)=>(
                <tr key={c.id} style={{borderBottom:i<scheduled.length-1?`1px solid #F8FAFC`:"none"}}>
                  <td style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:C.ink}}>{c.id}</td>
                  <td style={{padding:"10px 14px",fontSize:12,color:C.ink,maxWidth:200}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                  </td>
                  <td style={{padding:"10px 14px",fontSize:11,color:C.muted}}>{c.change_type||c.changeType}</td>
                  <td style={{padding:"10px 14px"}}><EnvTag e={c.environment}/></td>
                  <td style={{padding:"10px 14px",fontSize:11,color:C.ink,fontWeight:600,whiteSpace:"nowrap"}}>{c.deploy_date||c.deployDate}</td>
                  <td style={{padding:"10px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{c.deploy_start||c.deployStart} – {c.deploy_end||c.deployEnd}</td>
                  <td style={{padding:"10px 14px"}}><CRChip s={c.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scheduled.length===0&&(
        <div style={card(40)}>
          <Empty icon="📅" title="No scheduled deployments" sub="Change requests approved and scheduled will appear here"/>
        </div>
      )}
    </div>
  );
}

