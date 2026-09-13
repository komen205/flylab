// Bounded, scripted flight actuator driven by the existing neural controls.
function flightVelocity(action,yaw,y,base){
 const drive=Number.isFinite(action.forward)?Math.max(0,Math.min(20,action.forward))/20:0
 const vertical=drive>.5?.06:drive>0?-.04:0
 return {x:-Math.sin(yaw)*.12*drive,z:-Math.cos(yaw)*.12*drive,
 y:Math.max(base-y,Math.min(base+6-y,vertical))}
}
function createFlight(bot){
 let allowed=false,active=false,ready=false,base=0,gravity=null,lastAction={forward:0},lastUpdate=0
 function disable(){if(active){bot.physics.gravity=gravity;bot.entity.velocity.set(0,0,0)}active=false}
 bot._client.on('abilities',p=>{allowed=!!(p.flags&4);if(!allowed)disable()})
 bot._client.on('respawn',()=>{disable();ready=false})
 bot.on('physicsTick',()=>{
  if(!ready||!allowed)return
  if(!active){base=bot.entity.position.y;gravity=bot.physics.gravity;bot.physics.gravity=0;bot._client.write('abilities',{flags:2});active=true;console.log('FLIGHT_ENABLED',base)}
  const v=flightVelocity(Date.now()-lastUpdate<1000?lastAction:{forward:0},bot.entity.yaw,bot.entity.position.y,base)
  bot.entity.velocity.set(v.x,v.y,v.z)
 })
 return {update(action){ready=true;lastAction=action;lastUpdate=Date.now();return active},get active(){return active}}
}
module.exports={flightVelocity,createFlight}
