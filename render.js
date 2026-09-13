// Coarse voxel camera: block geometry -> flat RGB pixels. No object recognition.
const colors={white_concrete:[220,220,210],red_concrete:[175,35,35],blue_concrete:[40,60,185],gold_block:[240,195,40],stone:[120,120,120],grass_block:[95,140,65],bedrock:[65,65,65]}
function raycast(origin,direction,getBlock,maxDistance=40){
  const cell=origin.map(Math.floor),step=direction.map(d=>d>=0?1:-1)
  const delta=direction.map(d=>d===0?Infinity:Math.abs(1/d))
  const next=direction.map((d,i)=>d===0?Infinity:((d>0?cell[i]+1:cell[i])-origin[i])/d)
  let distance=0,face=1
  while(distance<maxDistance){
    const b=getBlock(...cell)
    if(b && b.boundingBox==='block')return {name:b.name,distance,face,point:origin.map((v,i)=>v+direction[i]*distance)}
    const axis=next[0]<next[1]?(next[0]<next[2]?0:2):(next[1]<next[2]?1:2)
    distance=next[axis];next[axis]+=delta[axis];cell[axis]+=step[axis];face=axis
  }
  return null
}
function render(origin,yaw,pitch,getBlock,width=64,height=48,detail=false){
  const rgb=Buffer.alloc(width*height*3),cache=new Map()
  const cached=(x,y,z)=>{const key=`${x},${y},${z}`;if(!cache.has(key))cache.set(key,getBlock(x,y,z));return cache.get(key)}
  const forward=[-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)]
  const right=[Math.cos(yaw),0,-Math.sin(yaw)]
  const up=[Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),Math.cos(yaw)*Math.sin(pitch)]
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=(2*(x+.5)/width-1)*Math.tan(Math.PI/5)*(width/height),sy=(1-2*(y+.5)/height)*Math.tan(Math.PI/5)
    let d=forward.map((v,i)=>v+sx*right[i]+sy*up[i]);const norm=Math.hypot(...d);d=d.map(v=>v/norm)
    const hit=raycast(origin,d,cached)
    const color=hit?(colors[hit.name]||[145,130,115]):[145,190,240]
    const shade=hit?([.8,1,.65][hit.face]*Math.max(.4,1-hit.distance/60)):1
    let texture=1
    if(detail&&hit){
      const axes=[0,1,2].filter(a=>a!==hit.face),uv=axes.map(a=>hit.point[a]-Math.floor(hit.point[a]));
      const edge=uv.some(v=>v<.018||v>.982)
      const grain=Math.sin(Math.floor(hit.point[axes[0]]*16)*127.1+Math.floor(hit.point[axes[1]]*16)*311.7)*43758.5453
      texture=edge?.78:.95+.1*(grain-Math.floor(grain))
    }
    for(let c=0;c<3;c++)rgb[(y*width+x)*3+c]=Math.round(color[c]*shade*texture)
  }
  return rgb
}
module.exports={render,raycast}
