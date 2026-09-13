const {test}=require('node:test'),assert=require('node:assert/strict')
const {raycast,render}=require('../render'),{movement}=require('../controls')
test('camera hits wall at correct distance without stepping through it',()=>{
 const hit=raycast([.5,1.5,.5],[0,0,-1],(x,y,z)=>z===-3?{name:'stone',boundingBox:'block'}:null)
 assert.equal(hit.name,'stone');assert.equal(hit.distance,2.5)
})
test('different views produce different pixels',()=>{
 const world=(x,y,z)=>z===-3?{name:'red_concrete',boundingBox:'block'}:null
 assert.notDeepEqual(render([0,2,0],0,0,world),render([0,2,0],Math.PI,0,world))
})
test('zero neural signal produces no movement; excessive or invalid signals bounded',()=>{
 assert.deepEqual(movement({turn:0,forward:0}),{yawDelta:-0,forwardMs:0})
 assert.equal(movement({turn:999,forward:999}).forwardMs,50)
 assert.throws(()=>movement({turn:NaN,forward:0}))
})
