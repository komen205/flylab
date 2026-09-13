"""Start a disposable local arena, run a bounded bot experiment, stop both."""
import subprocess,threading,time,os,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
JAVA=os.environ.get('JAVA','java')
ready=threading.Event()
server=subprocess.Popen([JAVA,'-Dterminal.jline=false','-Dterminal.ansi=false','-Xms512M','-Xmx1G','-jar','paper.jar','--nogui'],cwd=ROOT/'test-server',stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
def logs():
    with (ROOT/'test-server/console.log').open('w') as f:
        for line in server.stdout:
            f.write(line);f.flush()
            if 'Done (' in line:ready.set()
            if 'FlyBrain joined the game' in line:
                command('tp FlyBrain 0.5 101 0.5 180 0')
            if 'ERROR' in line:print(line.strip(),flush=True)
threading.Thread(target=logs,daemon=True).start()
def command(s):server.stdin.write(s+'\n');server.stdin.flush()
bot=None
try:
    if not ready.wait(90):raise RuntimeError('Test server did not start; see console.log')
    command('forceload add -32 -32 32 32')
    time.sleep(3)
    for s in ['fill -17 100 -17 17 106 17 minecraft:air','fill -17 100 -17 17 100 17 minecraft:stone',
              'fill -17 101 -17 17 105 -17 minecraft:white_concrete',
              'fill -17 101 17 17 105 17 minecraft:white_concrete',
              'fill -17 101 -17 -17 105 17 minecraft:red_concrete',
              'fill 17 101 -17 17 105 17 minecraft:blue_concrete',
              'fill -2 101 -16 2 104 -16 minecraft:gold_block',
              'setworldspawn 0 101 0 180','time set 6000','weather clear']:
        command(s)
    time.sleep(2)
    print('LOCAL_ARENA_READY 127.0.0.1:25586',flush=True)
    bot=subprocess.Popen(['node','bot.js'],cwd=ROOT)
    bot.wait(timeout=900)
    if bot.returncode:raise RuntimeError(f'Bot exited {bot.returncode}')
finally:
    if bot and bot.poll() is None:
        bot.terminate()
        try:bot.wait(timeout=5)
        except subprocess.TimeoutExpired:bot.kill();bot.wait()
    if server.poll() is None:
        command('stop')
        try:server.wait(timeout=30)
        except subprocess.TimeoutExpired:server.terminate();server.wait(timeout=10)
