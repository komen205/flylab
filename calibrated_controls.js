// Frozen calibration from a recorded run. No online learning or weight changes.
const defaults={turnBias:2.193901025623874,forwardRateBaseline:59.5255}
function createController(config=defaults){
 let turn=0,lastInteraction=-Infinity
 return function map(raw,now=Date.now()){
  if(!Number.isFinite(raw.turn)||!Number.isFinite(raw.forward))throw Error('Invalid neural output')
  const rate=(raw.readouts||[]).filter(r=>r.type==='DNpe017').reduce((s,r)=>s+r.rate_hz,0)
  if(!Number.isFinite(rate)||rate<0)throw Error('Invalid neural rate')
  const active=rate>0
  const residual=active?raw.turn-config.turnBias:0
  const target=Math.sign(residual)*Math.max(0,Math.abs(residual)-.35)*.65
  turn=active?.7*turn+.3*Math.max(-3,Math.min(3,target)):0
  const forward=20*rate/(rate+config.forwardRateBaseline)
  // A burst threshold, not a biologically identified attack neuron.
  const attack=raw.attack===true&&rate>config.forwardRateBaseline*1.5&&now-lastInteraction>=1500
  if(attack)lastInteraction=now
  return {...raw,rawTurn:raw.turn,rawForward:raw.forward,rawAttack:raw.attack,turn,forward,attack,controller:'calibrated-v1'}
 }
}
module.exports={createController,defaults}
