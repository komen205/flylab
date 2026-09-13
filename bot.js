const mineflayer=require('mineflayer'),{spawn}=require('node:child_process'),readline=require('node:readline'),path=require('node:path'),fs=require('node:fs')
const {render}=require('./render'),{movement}=require('./controls')
const {Vec3}=require('vec3')
const {createInteractions}=require('./interactions')
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const frames=Number(process.env.FRAMES||40)
if(!Number.isInteger(frames)||frames<0)throw Error('FRAMES must be a nonnegative integer (0 = continuous)')
const live=process.env.MC_LIVE==='1'
fs.mkdirSync(path.join(__dirname,'run'),{recursive:true})
const worker=spawn(path.join(__dirname,'../minecraft-flybrain/.venv/bin/python'),[path.join(__dirname,'brain_worker.py')],{stdio:['pipe','pipe','inherit']})
let receive,bot,ended=false
const lines=readline.createInterface({input:worker.stdout})
const queued=[]
lines.on('line',line=>{const obj=JSON.parse(line);if(receive){const r=receive;receive=null;r(obj)}else queued.push(obj)})
const next=()=>new Promise((resolve,reject)=>{
 if(queued.length)return resolve(queued.shift())
 const timer=setTimeout(()=>{receive=null;reject(Error('Neural worker timeout'))},60000)
 receive=obj=>{clearTimeout(timer);resolve(obj)}
})
async function stop(){if(ended)return;ended=true;bot?.clearControlStates();bot?.quit();worker.stdin.end();worker.kill();}
process.on('SIGINT',()=>{stop().then(()=>process.exit(0))})
process.on('SIGTERM',()=>{stop().then(()=>process.exit(0))})
worker.on('error',e=>{console.error(e);stop();process.exitCode=1})
async function main(){
 const ready=await next();if(!ready.ready)throw Error(JSON.stringify(ready));console.log('NEURAL_READY',JSON.stringify(ready))
 bot=mineflayer.createBot({host:process.env.MC_HOST||'127.0.0.1',port:Number(process.env.MC_PORT||(live?25565:25586)),username:process.env.MC_USERNAME||(live?'FlyBrainLab':'FlyBrain'),auth:process.env.MC_AUTH||'offline'})
 for(const event of ['login','respawn'])bot._client.on(event,p=>{bot.labWorld=((p.worldState||p).worldName||(p.worldState||p).name);console.log('LAB_WORLD',bot.labWorld)})
 bot.on('error',e=>console.error('BOT_ERROR',e.message));bot.on('kicked',e=>console.error('KICKED',e))
 bot.on('end',()=>{stop();process.exitCode=0})
 await new Promise((resolve,reject)=>{bot.once('spawn',resolve);bot.once('error',reject);bot.once('kicked',e=>reject(Error(JSON.stringify(e))))})
 if(live){
   console.log('BOT_CONNECTED_WAITING_FOR_ARENA')
   const deadline=Date.now()+60000
   while(!fs.existsSync(path.join(__dirname,'run/live-ready'))){
     if(ended||Date.now()>deadline)throw Error('Live arena was not prepared in time')
     await sleep(250)
   }
 }
 await bot.waitForChunksToLoad();await sleep(1000)
 if(bot.entity.position.y<100)throw Error('Arena setup failed: bot is below the arena floor')
 const pick=bot.inventory.items().find(i=>i.name==='diamond_pickaxe')
 if(pick)await bot.equip(pick,'hand')
 const interact=createInteractions(bot)
 console.log('BOT_SPAWNED',bot.version)
 for(let frame=0;(frames===0||frame<frames)&&!ended;frame++){
   bot.clearControlStates()
   const p=bot.entity.position
   const rgb=render([p.x,p.y+1.62,p.z],bot.entity.yaw,bot.entity.pitch,(x,y,z)=>bot.blockAt(new Vec3(x,y,z)))
   if(frame%3===0){
     const view=render([p.x,p.y+1.62,p.z],bot.entity.yaw,bot.entity.pitch,(x,y,z)=>bot.blockAt(new Vec3(x,y,z)),256,192,true)
     const tmp=path.join(__dirname,'run/viewer.ppm.tmp')
     fs.writeFileSync(tmp,Buffer.concat([Buffer.from('P6\n256 192\n255\n'),view]))
     fs.renameSync(tmp,path.join(__dirname,'run/viewer.ppm'))
   }
   worker.stdin.write(JSON.stringify({rgb:rgb.toString('base64'),width:64,height:48,frame})+'\n')
   const action=await next();if(action.error)throw Error(action.error)
   await interact(action.attack===true && (!live||bot.labWorld==='minecraft:flylab'))
   const m=movement(action)
   await bot.look(bot.entity.yaw+m.yawDelta,bot.entity.pitch,true)
   if(m.forwardMs>=1){bot.setControlState('forward',true);await sleep(m.forwardMs)}
   bot.clearControlStates()
   await sleep(Math.max(0,50-m.forwardMs))
   const row={frame,position:bot.entity.position,yaw:bot.entity.yaw,turn:action.turn,forward:action.forward,attack:action.attack,spikes:action.spikes,compute_seconds:action.compute_seconds}
   fs.appendFileSync(path.join(__dirname,'run/bot.jsonl'),JSON.stringify(row)+'\n')
   console.log('FRAME',JSON.stringify(row))
 }
 await stop()
}
main().catch(async e=>{console.error(e);await stop();process.exitCode=1})
