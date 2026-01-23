
'use client'
export default function AccentPicker({ value, onChange }:{ value:string; onChange:(v:string)=>void }){
  const colors = ['#0ea5e9','#f97316','#22c55e','#a78bfa','#ef4444','#f59e0b','#ec4899']
  return (
    <div className="flex gap-2">
      {colors.map(c=>(
        <button key={c} type="button" onClick={()=>onChange(c)} className="w-8 h-8 rounded-full border-2 border-white/30" style={{backgroundColor:c}} aria-label={c} />
      ))}
    </div>
  )
}
