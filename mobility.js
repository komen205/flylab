// Explicit game-button mapping, not learned fly behaviour.
function mobility(action,now,lastJump,inWater,onGround){
 const active=Number.isFinite(action.forward)&&action.forward>0
 return {sprint:active&&action.forward>=15&&!inWater,
 jump:active&&(inWater||(action.attack===true&&onGround&&now-lastJump>=1000))}
}
module.exports={mobility}
