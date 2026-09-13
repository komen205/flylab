function movement(action){
  if(!Number.isFinite(action.turn)||!Number.isFinite(action.forward))throw Error('Invalid neural output')
  return {yawDelta:-Math.max(-6,Math.min(6,action.turn))*Math.PI/180,
    forwardMs:50*Math.max(0,Math.min(20,action.forward))/20}
}
module.exports={movement}
