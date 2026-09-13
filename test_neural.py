"""Checks the adapter boundary, not whether fly vision or learning is valid."""
import sys
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'minecraft-flybrain'))
from doom.engine import NeuralControls

def test_silent_neurons_never_produce_actions():
    rows=[{'index':0,'id':'1','type':'DNp20','side':'R'},
          {'index':1,'id':'2','type':'DNp20','side':'L'},
          {'index':2,'id':'3','type':'DNpe017','side':'L'}]
    c=NeuralControls(rows,mode='bci')
    a=c.decode(np.zeros(3),.05)
    assert a['turn']==0 and a['forward']==0 and not a['attack']
    a=c.decode(np.array([2,0,3]),.05)
    assert a['turn']>0 and a['forward']>0
