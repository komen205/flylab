// Scripted safety limits around a neural button; not learned target selection.
function allowedBlock(b){return !!b&&b.name==='clay'&&Math.abs(b.position.x)<=14&&Math.abs(b.position.z)<=14&&b.position.y>=101&&b.position.y<=104}
function createInteractions(bot){
 let digging=null,lastHit=0
 return async function update(signal){
  const block=bot.world ? bot.world.raycast(bot.entity.position.offset(0,1.62,0),new (require('vec3').Vec3)(-Math.sin(bot.entity.yaw)*Math.cos(bot.entity.pitch),Math.sin(bot.entity.pitch),-Math.cos(bot.entity.yaw)*Math.cos(bot.entity.pitch)),3) : bot.blockAtCursor(3),entity=bot.entityAtCursor(3)
  if(digging&&(!signal||!block||!allowedBlock(block)||!block.position.equals(digging))){bot.stopDigging();digging=null}
  if(!signal)return
  // Only slimes are test combat targets. Players and their pets are excluded.
  if(entity){
   if(entity.name==='slime'&&Math.abs(entity.position.x)<=14&&Math.abs(entity.position.z)<=14&&entity.position.y>=101&&entity.position.y<=104&&Date.now()-lastHit>=1000){bot.attack(entity);lastHit=Date.now();console.log('NEURAL_ATTACK slime')}
   return
  }
  if(!digging&&allowedBlock(block)&&bot.canDigBlock(block)){
   const target=block.position.clone();digging=target
   bot.clearControlStates()
   console.log('NEURAL_DIG_START',target.toString(),'duration_ms',bot.digTime(block))
   const timeout=setTimeout(()=>bot.stopDigging(),2500)
   try{await bot.dig(block,'ignore');console.log('NEURAL_MINED',target.toString())}
   catch(e){console.log('NEURAL_DIG_STOP',e.message)}
   finally{clearTimeout(timeout);if(digging===target)digging=null}
  }
 }
}
module.exports={allowedBlock,createInteractions}
